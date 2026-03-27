import cv2
import os
from ultralytics import YOLO
from datetime import datetime
import uuid

def yolov11_pose_detect(image_path, model_path, save_dir, show=False):
    """
    YOLOv11 姿态估计接口
    返回: results, output_img_path, info
    """
    model = YOLO(model_path)
    results = model(image_path)

    # 生成输出路径
    os.makedirs(save_dir, exist_ok=True)
    unique_id = datetime.now().strftime("%Y%m%d%H%M%S") + "_" + uuid.uuid4().hex[:8]
    output_img_path = os.path.join(save_dir, f"pose_{unique_id}.jpg")

    # 渲染姿态关键点
    annotated_img = results[0].plot(kpt_line=True, kpt_radius=4)
    cv2.imwrite(output_img_path, annotated_img)

    # 整理返回信息
    info = {
        "status": "success",
        "detect_count": len(results[0]),
        "classes": []
    }

    for i, box in enumerate(results[0].boxes):
        cls_id = int(box.cls[0])
        conf = float(box.conf[0]) * 100
        bbox = box.xyxy[0].tolist()
        keypoints = results[0].keypoints[i].xy[0].tolist() if results[0].keypoints else []
        info["classes"].append({
            "class": "person",
            "confidence": round(conf, 2),
            "bbox": bbox,
            "keypoints": keypoints,
            "pose_label": "standing" if conf > 0.5 else "falling"  # 简单姿态判断
        })

    return results, output_img_path, info