import cv2
import torch
import numpy as np
import asyncio
from typing import List, Dict, Optional
from dataclasses import dataclass
from 开发目录.weather_detection.weather_adaptation import WeatherCondition, ProcessedFrame


@dataclass
class DetectionConfig:
    """检测配置（对齐文档指标）"""
    confidence_threshold: float = 0.5
    nms_threshold: float = 0.4
    max_detections: int = 100
    input_size: tuple = (640, 480)
    use_fp16: bool = True
    enable_tensorrt: bool = False


@dataclass
class DetectionResult:
    """检测结果结构"""
    bbox: List[float]  # [x1, y1, x2, y2]
    confidence: float
    class_name: str = "person"
    sensor_type: str = "visible"
    is_fused: bool = False


class AdvancedDetectionService:
    """多模态人体检测服务（支持极端天气）"""

    def __init__(self, config: DetectionConfig = DetectionConfig()):
        self.config = config
        self.device = self._get_optimal_device()
        self.models = self._load_weather_specific_models()

    def _get_optimal_device(self) -> torch.device:
        """获取最优计算设备（GPU/CPU/MPS）"""
        if torch.cuda.is_available():
            device = torch.device("cuda")
            # 启用TensorRT加速（文档要求）
            if self.config.enable_tensorrt:
                torch.backends.cudnn.benchmark = True
            return device
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return torch.device("mps")
        return torch.device("cpu")

    def _load_weather_specific_models(self) -> Dict[WeatherCondition, torch.nn.Module]:
        """加载各天气专属模型（对齐文档模型策略）"""
        models = {}
        for weather in WeatherCondition:
            model_path = f"models/{weather.value}/model.pt"
            try:
                # 加载预训练模型（实际场景可替换为自定义模型）
                model = self._load_model(model_path)
                model.to(self.device)
                model.eval()
                # 半精度推理加速
                if self.config.use_fp16 and self.device.type == "cuda":
                    model.half()
                models[weather] = model
            except Exception as e:
                print(f"加载{weather.value}模型失败: {e}")
                # 回退到晴天模型
                if WeatherCondition.CLEAR in models:
                    models[weather] = models[WeatherCondition.CLEAR]
        return models

    def _load_model(self, model_path: str) -> torch.nn.Module:
        """加载模型（示例：FasterRCNN，可替换为自定义模型）"""
        # 实际场景替换为本地模型加载逻辑
        from torchvision.models.detection import fasterrcnn_resnet50_fpn
        model = fasterrcnn_resnet50_fpn(
            pretrained=True,
            box_detections_per_img=self.config.max_detections
        )
        # 若有本地权重则加载
        try:
            model.load_state_dict(torch.load(model_path, map_location=self.device))
        except FileNotFoundError:
            pass
        return model

    async def detect(
            self,
            processed_frame: ProcessedFrame,
            thermal_data: Optional[np.ndarray] = None,
            radar_data: Optional[Dict] = None,
            use_multimodal: bool = True
    ) -> List[DetectionResult]:
        """执行检测（支持多模态融合）"""
        # 1. 单模态检测（可见光）
        visible_results = await self._single_modal_detect(processed_frame)

        if not use_multimodal or (thermal_data is None and radar_data is None):
            return visible_results

        # 2. 多模态检测（红外+雷达）
        detection_tasks = [asyncio.create_task(self._single_modal_detect(processed_frame))]
        sensor_types = ["visible"]

        if thermal_data is not None:
            detection_tasks.append(asyncio.create_task(self._thermal_detect(thermal_data)))
            sensor_types.append("thermal")

        if radar_data is not None:
            detection_tasks.append(asyncio.create_task(self._radar_detect(radar_data)))
            sensor_types.append("radar")

        # 3. 并行执行+结果融合
        results = await asyncio.gather(*detection_tasks, return_exceptions=True)
        fused_results = self._fuse_multimodal_results(results, sensor_types)

        return fused_results

    async def _single_modal_detect(self, processed_frame: ProcessedFrame) -> List[DetectionResult]:
        """单模态（可见光）检测"""
        # 预处理图像
        img = self._preprocess_image(processed_frame.enhanced)
        # 模型推理（异步执行避免阻塞）
        with torch.no_grad():
            if self.config.use_fp16 and self.device.type == "cuda":
                img = img.half()
            model = self.models[processed_frame.weather]
            outputs = model(img)

        # 解析结果
        return self._parse_detection_outputs(
            outputs[0],
            processed_frame.detection_params["conf_thresh"],
            processed_frame.detection_params["nms_thresh"],
            sensor_type="visible"
        )

    async def _thermal_detect(self, thermal_data: np.ndarray) -> List[DetectionResult]:
        """红外热成像检测"""
        # 红外数据预处理（温度阈值筛选人体区域）
        thermal_gray = cv2.normalize(thermal_data, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        # 人体温度范围（36-38℃）映射到热成像数值
        _, thresh = cv2.threshold(thermal_gray, 200, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        results = []
        for cnt in contours:
            if cv2.contourArea(cnt) > 50:  # 过滤小区域
                x, y, w, h = cv2.boundingRect(cnt)
                results.append(DetectionResult(
                    bbox=[x, y, x + w, y + h],
                    confidence=0.9,  # 热成像置信度
                    sensor_type="thermal"
                ))
        return results

    async def _radar_detect(self, radar_data: Dict) -> List[DetectionResult]:
        """毫米波雷达检测"""
        # 解析雷达点云数据，筛选人体尺寸的目标
        results = []
        for point in radar_data.get("points", []):
            if 0.3 < point["size"] < 2.0:  # 人体尺寸范围
                results.append(DetectionResult(
                    bbox=[
                        point["x"] - 0.5, point["y"] - 1.0,
                        point["x"] + 0.5, point["y"] + 1.0
                    ],
                    confidence=0.85,
                    sensor_type="radar"
                ))
        return results

    def _fuse_multimodal_results(
            self,
            results_list: List[List[DetectionResult]],
            sensor_types: List[str]
    ) -> List[DetectionResult]:
        """多模态结果融合（基于IoU加权投票）"""
        # 过滤异常结果
        valid_results = []
        valid_sensors = []
        for res, sensor in zip(results_list, sensor_types):
            if not isinstance(res, Exception) and len(res) > 0:
                valid_results.append(res)
                valid_sensors.append(sensor)

        if len(valid_results) == 0:
            return []
        if len(valid_results) == 1:
            return valid_results[0]

        # 1. 收集所有检测框
        all_detections = []
        for res, sensor in zip(valid_results, valid_sensors):
            for det in res:
                det.sensor_type = sensor
                all_detections.append(det)

        # 2. 基于IoU聚类
        clusters = self._cluster_by_iou(all_detections, iou_thresh=0.5)

        # 3. 融合每个聚类
        fused = []
        for cluster in clusters:
            if len(cluster) == 0:
                continue
            # 计算融合框和置信度
            fused_bbox = self._compute_fused_bbox(cluster)
            fused_conf = self._compute_fused_confidence(cluster)
            # 传感器权重
            sensor_weights = {s: 0 for s in valid_sensors}
            for det in cluster:
                sensor_weights[det.sensor_type] += 1
            total = sum(sensor_weights.values())
            sensor_weights = {k: v / total for k, v in sensor_weights.items()}

            fused.append(DetectionResult(
                bbox=fused_bbox,
                confidence=fused_conf,
                is_fused=True
            ))

        return fused

    # 辅助函数
    def _preprocess_image(self, img: np.ndarray) -> torch.Tensor:
        """图像预处理：缩放、归一化、转Tensor"""
        img_resized = cv2.resize(img, self.config.input_size)
        img_transposed = np.transpose(img_resized, (2, 0, 1))  # HWC→CHW
        img_normalized = img_transposed / 255.0
        tensor = torch.from_numpy(img_normalized).float().unsqueeze(0)
        return tensor.to(self.device)

    def _parse_detection_outputs(
            self,
            outputs: Dict,
            conf_thresh: float,
            nms_thresh: float,
            sensor_type: str
    ) -> List[DetectionResult]:
        """解析模型输出，过滤低置信度，执行NMS"""
        boxes = outputs["boxes"].cpu().numpy()
        scores = outputs["scores"].cpu().numpy()
        labels = outputs["labels"].cpu().numpy()

        # 过滤人体类别（label=1）和低置信度
        mask = (labels == 1) & (scores >= conf_thresh)
        boxes = boxes[mask]
        scores = scores[mask]

        # NMS非极大值抑制
        indices = cv2.dnn.NMSBoxes(
            boxes[:, :4].tolist(),
            scores.tolist(),
            conf_thresh,
            nms_thresh
        )

        results = []
        if len(indices) > 0:
            for i in indices.flatten():
                results.append(DetectionResult(
                    bbox=boxes[i].tolist(),
                    confidence=float(scores[i]),
                    sensor_type=sensor_type
                ))
        return results

    def _cluster_by_iou(self, detections: List[DetectionResult], iou_thresh: float) -> List[List[DetectionResult]]:
        """基于IoU聚类检测框"""
        clusters = []
        used = [False] * len(detections)

        for i, det in enumerate(detections):
            if used[i]:
                continue
            cluster = [det]
            used[i] = True
            # 寻找IoU大于阈值的检测框
            for j, other in enumerate(detections[i + 1:]):
                if used[i + j + 1]:
                    continue
                iou = self._calc_iou(det.bbox, other.bbox)
                if iou > iou_thresh:
                    cluster.append(other)
                    used[i + j + 1] = True
            clusters.append(cluster)

        return clusters

    def _calc_iou(self, bbox1: List[float], bbox2: List[float]) -> float:
        """计算IoU（交并比）"""
        x1 = max(bbox1[0], bbox2[0])
        y1 = max(bbox1[1], bbox2[1])
        x2 = min(bbox1[2], bbox2[2])
        y2 = min(bbox1[3], bbox2[3])

        if x2 < x1 or y2 < y1:
            return 0.0

        intersection = (x2 - x1) * (y2 - y1)
        area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
        area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
        union = area1 + area2 - intersection

        return intersection / union if union > 0 else 0.0

    def _compute_fused_bbox(self, cluster: List[DetectionResult]) -> List[float]:
        """计算聚类的融合检测框（平均坐标）"""
        x1 = np.mean([det.bbox[0] for det in cluster])
        y1 = np.mean([det.bbox[1] for det in cluster])
        x2 = np.mean([det.bbox[2] for det in cluster])
        y2 = np.mean([det.bbox[3] for det in cluster])
        return [float(x1), float(y1), float(x2), float(y2)]

    def _compute_fused_confidence(self, cluster: List[DetectionResult]) -> float:
        """计算融合置信度（加权平均）"""
        # 传感器权重：可见光0.4，红外0.35，雷达0.25
        weights = {
            "visible": 0.4,
            "thermal": 0.35,
            "radar": 0.25
        }
        total_weight = 0.0
        total_conf = 0.0

        for det in cluster:
            weight = weights.get(det.sensor_type, 0.4)
            total_conf += det.confidence * weight
            total_weight += weight

        return float(total_conf / total_weight) if total_weight > 0 else 0.0