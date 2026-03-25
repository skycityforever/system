from ultralytics import YOLO

# 加载YOLO模型的配置文件，并加载预训练权重文件
model = YOLO("yolo11s-pose.yaml").load("weights/yolo11s-pose.pt")

# 使用coco8-pose.yaml数据集进行训练，训练10个epoch，并将图像大小设置为640像素
results = model.train(data="data.yaml", epochs=10, imgsz=640)