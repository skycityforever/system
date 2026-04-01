import os
import cv2
import numpy as np
from tensorflow.keras.models import load_model

# ====================== 配置 ======================
MODEL_PATH = r"..\models"
IMG_SIZE = 64

# ====================== 加载模型和类别 ======================
def load_latest_model():
    # 加载类别名称
    class_names = []
    with open(os.path.join(MODEL_PATH, "class_names.txt"), "r", encoding="utf-8") as f:
        class_names = [line.strip() for line in f.readlines()]

    # 加载最新模型
    model_files = sorted([f for f in os.listdir(MODEL_PATH) if f.endswith(".keras")])
    if not model_files:
        raise Exception("未找到训练好的模型！请先运行 train.py")
    latest_model_path = os.path.join(MODEL_PATH, model_files[-1])
    model = load_model(latest_model_path)
    print(f"加载最新模型: {latest_model_path}")
    return model, class_names

# ====================== 实时测试 ======================
def test_realtime():
    model, class_names = load_latest_model()
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    cap = cv2.VideoCapture(0)

    print("实时识别启动，按 q 退出...")
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            # 预处理人脸
            face = gray[y:y+h, x:x+w]
            face = cv2.resize(face, (IMG_SIZE, IMG_SIZE))
            face = face / 255.0
            face = face.reshape(1, IMG_SIZE, IMG_SIZE, 1)

            # 模型预测
            pred = model.predict(face, verbose=0)
            cls_idx = np.argmax(pred)
            name = class_names[cls_idx]
            acc = np.max(pred)

            # 绘制结果
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f"{name} {acc:.2f}",
                        (x, y-10), cv2.FONT_HERSHEY_SIMPLEX,
                        0.8, (0, 255, 0), 2)

        cv2.imshow("Face Recognition Test", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    test_realtime()