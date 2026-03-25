import os
import cv2
import torch
from ultralytics import RTDETR

def rtdetr_detect(image_path, model_path, save_dir='runs/detect', show=False):
    try:
        model = RTDETR(model_path)
        results = model(image_path)

        output_img_path = os.path.join(save_dir, os.path.basename(image_path))
        os.makedirs(save_dir, exist_ok=True)

        img = cv2.imread(image_path)
        classes = []
        detect_count = 0

        for result in results:
            detect_count = len(result.boxes)
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = round(float(box.conf[0]) * 100, 2)
                cls_id = int(box.cls[0])
                cls_name = model.names[cls_id]

                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(img, f"{cls_name} {conf}%", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                classes.append({
                    "class": cls_name,
                    "confidence": conf,
                    "bbox": [x1, y1, x2, y2]
                })

        cv2.imwrite(output_img_path, img)
        return results, output_img_path, {
            "status": "ok",
            "detect_count": detect_count,
            "classes": classes
        }

    except Exception as e:
        return None, "", {
            "status": "error",
            "msg": str(e)
        }