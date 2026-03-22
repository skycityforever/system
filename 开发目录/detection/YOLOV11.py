# -*- coding: utf-8 -*-
from ultralytics import YOLO
import os
import warnings
warnings.filterwarnings('ignore')

def yolov11_detect(image_path, model_path='model_pt/yolo11s.pt', save_dir='runs/detect', show=False):
    if not os.path.exists(image_path):
        return None, None, {'status': 'error', 'msg': f'图片路径不存在：{image_path}', 'detect_count': 0, 'classes': []}
    if not os.path.exists(model_path):
        return None, None, {'status': 'error', 'msg': f'模型文件不存在：{model_path}', 'detect_count': 0, 'classes': []}
    try:
        model = YOLO(model_path)
        results = model.predict(source=image_path, save=True, save_dir=save_dir, show=show, conf=0.25, iou=0.45)
        result = results[0]
        detect_count = len(result.boxes)
        detect_classes = []
        for box in result.boxes:
            cls_name = result.names[int(box.cls)]
            conf = round(float(box.conf)*100, 2)
            detect_classes.append({'class': cls_name, 'confidence': conf, 'bbox': box.xyxy.tolist()[0]})
        img_filename = os.path.basename(image_path)
        output_img_path = os.path.join(save_dir, img_filename)
        info = {'status': 'success', 'msg': '检测完成', 'detect_count': detect_count, 'classes': detect_classes}
        return results, output_img_path, info
    except Exception as e:
        return None, None, {'status': 'error', 'msg': f'检测失败：{str(e)}', 'detect_count': 0, 'classes': []}

if __name__ == '__main__':
    test_image_path = '../detection_resource/8.png'
    results, output_path, info = yolov11_detect(image_path=test_image_path, show=False)
    print("="*50)
    print(f"检测状态：{info['status']}")
    print(f"提示信息：{info['msg']}")
    print(f"检测到目标数：{info['detect_count']}")
    if info['detect_count'] > 0:
        print("检测到的目标：")
        for i, cls in enumerate(info['classes']):
            print(f"  {i+1}. 类别：{cls['class']} | 置信度：{cls['confidence']}% | 坐标：{cls['bbox']}")
    print(f"带框结果图路径：{output_path}")
    print("="*50)