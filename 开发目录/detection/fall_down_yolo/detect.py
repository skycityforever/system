from ultralytics import YOLO
import cv2

# ====================== 加载你训练好的模型 ======================
# 如果你用官方预训练权重 → yolo11s-pose.pt
# 如果你用自己训练的 → runs/pose/train/weights/best.pt
model = YOLO("开发目录/detection/fall_down_yolo/weights/yolo11s-pose.pt")

# ====================== 指定要检测的图片 ======================
img_path = r"C:\Users\Lenovo\Desktop\极端天气人体识别检测系统\system\开发目录\detection\fall_down_yolo\images\val\people(8801).jpg"   # 把这里改成你的图片路径
save_path = "result_pose.jpg"  # 保存的文件名

# ======================= 姿态估计 =========================
results = model(img_path)

# ======================= 保存图片 =========================
# 读取原图
img = cv2.imread(img_path)

# 绘制姿态关键点
for result in results:
    keypoints = result.keypoints  # 姿态关键点
    boxes = result.boxes          # 检测框

    if keypoints is not None:
        for kp in keypoints.xy:
            for (x, y) in kp:
                if x > 0 and y > 0:
                    cv2.circle(img, (int(x), int(y)), 3, (0, 255, 0), -1)

# 保存图片
cv2.imwrite(save_path, img)

print(f"✅ 姿态检测完成！已保存到：{save_path}")