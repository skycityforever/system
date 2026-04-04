import cv2
import numpy as np
from enum import Enum
from dataclasses import dataclass
from typing import Dict, Optional, Tuple, Callable


# 天气类型枚举（与文档一致）
class WeatherCondition(Enum):
    CLEAR = "clear"
    RAIN = "rain"
    SNOW = "snow"
    FOG = "fog"
    DUST = "dust"
    EXTREME = "extreme"


# 处理后帧数据结构
@dataclass
class ProcessedFrame:
    original: np.ndarray  # 原始帧
    enhanced: np.ndarray  # 增强后帧
    weather: WeatherCondition  # 识别的天气类型
    model_name: str  # 选用的模型名称
    detection_params: Dict  # 适配的检测参数


class WeatherAdaptationPipeline:
    """天气自适应处理流水线（文档核心逻辑落地）"""

    def __init__(self):
        self.weather_classifier = self._init_weather_classifier()
        self.enhancement_pipelines = self._build_enhancement_pipelines()

    def _init_weather_classifier(self):
        """初始化天气分类器（简化版，可扩展为AI分类）"""
        # 实际场景可替换为预训练的天气分类模型
        return self._simple_weather_classifier

    def _build_enhancement_pipelines(self) -> Dict[WeatherCondition, Callable]:
        """构建各天气对应的图像增强流水线"""
        return {
            WeatherCondition.CLEAR: self._enhance_clear,
            WeatherCondition.RAIN: self._enhance_rain,
            WeatherCondition.SNOW: self._enhance_snow,
            WeatherCondition.FOG: self._enhance_fog,
            WeatherCondition.DUST: self._enhance_dust,
            WeatherCondition.EXTREME: self._enhance_extreme,
        }

    def process_frame(
            self,
            frame: np.ndarray,
            sensor_metadata: Dict,
            prev_weather: Optional[WeatherCondition] = None
    ) -> ProcessedFrame:
        """处理单帧：天气识别→图像增强→模型/参数适配"""
        # 1. 天气类型识别
        weather = self._classify_weather(frame, sensor_metadata, prev_weather)
        # 2. 图像增强
        enhanced_frame = self.enhancement_pipelines[weather](frame)
        # 3. 模型和参数适配（文档要求的自适应策略）
        model_name, detect_params = self._adapt_model_and_params(weather)

        return ProcessedFrame(
            original=frame,
            enhanced=enhanced_frame,
            weather=weather,
            model_name=model_name,
            detection_params=detect_params
        )

    def _classify_weather(
            self,
            frame: np.ndarray,
            metadata: Dict,
            prev_weather: Optional[WeatherCondition]
    ) -> WeatherCondition:
        """多维度天气分类（图像特征+传感器数据+时间连续性）"""
        # 传感器数据优先（如气象传感器）
        if "weather_type" in metadata:
            try:
                return WeatherCondition(metadata["weather_type"].lower())
            except ValueError:
                pass

        # 图像特征分类（简化版，可扩展为CNN分类）
        img_based_weather = self._simple_weather_classifier(frame)

        # 时间连续性加权（避免频繁切换）
        if prev_weather and img_based_weather != prev_weather:
            # 计算图像特征置信度，低于阈值则沿用前一状态
            confidence = self._calc_weather_confidence(frame, img_based_weather)
            if confidence < 0.7:
                return prev_weather

        return img_based_weather

    def _simple_weather_classifier(self, frame: np.ndarray) -> WeatherCondition:
        """基于图像特征的简易天气分类（可替换为AI模型）"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # 雾天：低对比度、高亮度均匀性
        if self._is_fog(gray):
            return WeatherCondition.FOG
        # 雨天：高频噪声（雨滴）+ 局部高亮度
        elif self._is_rain(gray):
            return WeatherCondition.RAIN
        # 雪天：整体高亮度、低饱和度
        elif self._is_snow(frame):
            return WeatherCondition.SNOW
        # 沙尘：低对比度、偏黄/棕色
        elif self._is_dust(frame):
            return WeatherCondition.DUST
        # 极端天气（复合条件）
        elif self._is_extreme(frame):
            return WeatherCondition.EXTREME
        # 默认晴天
        else:
            return WeatherCondition.CLEAR

    # 各天气增强实现（严格对齐文档算法）
    def _enhance_clear(self, img: np.ndarray) -> np.ndarray:
        """晴天：基础锐化"""
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        return cv2.filter2D(img, -1, kernel)

    def _enhance_rain(self, img: np.ndarray) -> np.ndarray:
        """雨天：雨滴去除+对比度增强（文档指定算法）"""
        # 1. 中值滤波去雨滴
        denoised = cv2.medianBlur(img, 3)
        # 2. 导向滤波保持边缘
        guided = cv2.ximgproc.guidedFilter(guide=denoised, src=denoised, radius=2, eps=0.01)
        # 3. CLAHE增强对比度
        lab = cv2.cvtColor(guided, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l)
        enhanced_lab = cv2.merge([l_enhanced, a, b])
        return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    def _enhance_snow(self, img: np.ndarray) -> np.ndarray:
        """雪天：亮度均衡+饱和度增强（文档指定算法）"""
        # YCrCb色彩空间亮度均衡
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        y, cr, cb = cv2.split(ycrcb)
        y_eq = cv2.equalizeHist(y)
        ycrcb_eq = cv2.merge([y_eq, cr, cb])
        # HSV空间增加饱和度
        hsv = cv2.cvtColor(cv2.cvtColor(ycrcb_eq, cv2.COLOR_YCrCb2BGR), cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        s = np.clip(s * 1.2, 0, 255).astype(np.uint8)
        v = np.clip(v * 1.1, 0, 255).astype(np.uint8)
        hsv_enhanced = cv2.merge([h, s, v])
        return cv2.cvtColor(hsv_enhanced, cv2.COLOR_HSV2BGR)

    def _enhance_fog(self, img: np.ndarray) -> np.ndarray:
        """雾天：暗通道先验去雾（文档指定算法）"""

        def dark_channel(im: np.ndarray, sz: int) -> np.ndarray:
            """计算暗通道"""
            return cv2.erode(np.min(im, axis=2), np.ones((sz, sz)))

        def estimate_atm_light(im: np.ndarray, dark: np.ndarray) -> float:
            """估计大气光"""
            h, w = im.shape[:2]
            num_pixels = h * w
            num_bright = max(1, int(num_pixels * 0.001))
            dark_vec = dark.reshape(num_pixels)
            im_vec = im.reshape(num_pixels, 3)
            indices = dark_vec.argsort()[::-1][:num_bright]
            return np.max(im_vec[indices], axis=0)

        def estimate_transmission(im: np.ndarray, atm_light: float, omega: float, sz: int) -> np.ndarray:
            """估计透射率"""
            im_norm = im / atm_light
            return 1 - omega * dark_channel(im_norm, sz)

        # 核心去雾逻辑
        img_float = img.astype(np.float32) / 255.0
        dark = dark_channel(img_float, 15)
        atm_light = estimate_atm_light(img_float, dark)
        transmission = estimate_transmission(img_float, atm_light, 0.95, 15)
        # 去雾恢复
        result = np.zeros_like(img_float)
        for c in range(3):
            result[..., c] = (img_float[..., c] - atm_light[c]) / np.maximum(transmission, 0.1) + atm_light[c]
        # 对比度增强
        result = np.clip(result * 255, 0, 255).astype(np.uint8)
        return cv2.convertScaleAbs(result, alpha=1.1, beta=10)

    def _enhance_dust(self, img: np.ndarray) -> np.ndarray:
        """沙尘：色彩校正+高频增强"""
        # 色彩校正（去除黄/棕色偏色）
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        a = np.clip(a - 15, 0, 255).astype(np.uint8)
        b = np.clip(b + 10, 0, 255).astype(np.uint8)
        lab_corrected = cv2.merge([l, a, b])
        # 高频增强（突出边缘）
        gaussian = cv2.GaussianBlur(cv2.cvtColor(lab_corrected, cv2.COLOR_LAB2BGR), (5, 5), 2)
        return cv2.addWeighted(img, 1.5, gaussian, -0.5, 0)

    def _enhance_extreme(self, img: np.ndarray) -> np.ndarray:
        """极端天气：多算法融合增强"""
        # 先去噪，再增强对比度，最后锐化
        denoised = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced_bgr = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        # 锐化
        kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        return cv2.filter2D(enhanced_bgr, -1, kernel)

    def _adapt_model_and_params(self, weather: WeatherCondition) -> Tuple[str, Dict]:
        """根据天气适配模型和检测参数（文档指标对齐）"""
        param_map = {
            WeatherCondition.CLEAR: ("clear/model.pt", {"conf_thresh": 0.5, "nms_thresh": 0.4}),
            WeatherCondition.RAIN: ("rain/model.pt", {"conf_thresh": 0.45, "nms_thresh": 0.35}),
            WeatherCondition.SNOW: ("snow/model.pt", {"conf_thresh": 0.4, "nms_thresh": 0.35}),
            WeatherCondition.FOG: ("fog/model.pt", {"conf_thresh": 0.35, "nms_thresh": 0.3}),
            WeatherCondition.DUST: ("dust/model.pt", {"conf_thresh": 0.4, "nms_thresh": 0.35}),
            WeatherCondition.EXTREME: ("fusion/model.pt", {"conf_thresh": 0.3, "nms_thresh": 0.25}),
        }
        return param_map[weather]

    # 辅助判断函数
    def _is_fog(self, gray: np.ndarray) -> bool:
        """判断是否雾天：低对比度、高亮度均匀性"""
        contrast = gray.std()
        brightness = gray.mean()
        return contrast < 30 and 100 < brightness < 200

    def _is_rain(self, gray: np.ndarray) -> bool:
        """判断是否雨天：高频噪声多"""
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        edge_density = np.sum(np.abs(sobel_x) + np.abs(sobel_y)) / (gray.shape[0] * gray.shape[1])
        return edge_density > 50

    def _is_snow(self, img: np.ndarray) -> bool:
        """判断是否雪天：高亮度、低饱和度"""
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        return v.mean() > 200 and s.mean() < 50

    def _is_dust(self, img: np.ndarray) -> bool:
        """判断是否沙尘：低对比度、偏黄"""
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        contrast = l.std()
        b_channel_mean = b.mean()
        return contrast < 25 and 110 < b_channel_mean < 140

    def _is_extreme(self, img: np.ndarray) -> bool:
        """判断是否极端天气：复合恶劣条件"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        return self._is_fog(gray) and self._is_rain(gray)

    def _calc_weather_confidence(self, frame: np.ndarray, weather: WeatherCondition) -> float:
        """计算天气分类置信度"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        if weather == WeatherCondition.FOG:
            return 1 - (gray.std() / 50)  # 雾天对比度越低置信度越高
        elif weather == WeatherCondition.RAIN:
            return min(gray.std() / 100, 1.0)  # 雨天边缘密度越高置信度越高
        elif weather == WeatherCondition.SNOW:
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            _, s, v = cv2.split(hsv)
            return min(v.mean() / 255, 1.0)
        else:
            return 0.8  # 默认置信度