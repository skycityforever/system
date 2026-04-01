import os
import numpy as np
import cv2
import traceback
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import load_model, Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout

# ====================== 固定配置 ======================
BASE_PATH      = os.path.dirname(__file__)
DATA_FOLDER    = os.path.join("data")
MODEL_FOLDER   = os.path.join("models")
IMG_SIZE       = 64
BATCH_SIZE     = 4
EPOCHS         = 200

os.makedirs(MODEL_FOLDER, exist_ok=True)

# ====================== 查找最新模型 ======================
def get_latest_model_path():
    if not os.path.exists(MODEL_FOLDER):
        return None

    files = [f for f in os.listdir(MODEL_FOLDER) if f.endswith(".keras")]
    if not files:
        return None

    files.sort(key=lambda x: os.path.getmtime(os.path.join(MODEL_FOLDER, x)), reverse=True)
    return os.path.join(MODEL_FOLDER, files[0])

# ====================== 加载数据集 ======================
def load_dataset():
    X = []
    y = []
    class_names = []
    label = 0

    print("\n[信息] 正在读取数据集...")

    for person_dir in sorted(os.listdir(DATA_FOLDER)):
        person_path = os.path.join(DATA_FOLDER, person_dir)
        if not os.path.isdir(person_path):
            continue

        class_names.append(person_dir)
        count = 0

        for img_file in os.listdir(person_path):
            img_path = os.path.join(person_path, img_file)
            try:
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                if img is None:
                    continue
                img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
                X.append(img / 255.0)
                y.append(label)
                count += 1
            except:
                continue

        print(f"  - 类别 {person_dir} → {count} 张")
        label += 1

    if len(X) == 0:
        raise Exception("数据集为空！请检查 data 文件夹")

    X = np.array(X).reshape(-1, IMG_SIZE, IMG_SIZE, 1)
    y = to_categorical(y, num_classes=len(class_names))
    print(f"\n[信息] 数据集加载完成：{len(X)} 张，{len(class_names)} 类")
    return X, y, class_names

# ====================== 创建/加载模型 ======================
def get_model(num_classes):
    model_path = get_latest_model_path()

    if model_path is not None:
        print(f"[信息] 找到最新模型，继续训练：\n{model_path}")
        model = load_model(model_path)
        return model

    print("[信息] 未找到模型，从零开始创建...")
    model = Sequential([
        Conv2D(32, (3,3), activation="relu", input_shape=(IMG_SIZE, IMG_SIZE, 1)),
        MaxPooling2D((2,2)),
        Conv2D(64, (3,3), activation="relu"),
        MaxPooling2D((2,2)),
        Conv2D(128, (3,3), activation="relu"),
        MaxPooling2D((2,2)),
        Flatten(),
        Dense(256, activation="relu"),
        Dropout(0.4),
        Dense(num_classes, activation="softmax")
    ])

    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

# ====================== 训练主程序 ======================
def train():
    print("=" * 60)
    print("         人脸识别模型训练（支持断点续训）")
    print("=" * 60)

    try:
        X, y, classes = load_dataset()
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.1)
        model = get_model(len(classes))

        print(f"\n[信息] 开始训练 {EPOCHS} 轮...")
        model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            batch_size=BATCH_SIZE,
            epochs=EPOCHS
        )

        # 保存新模型
        new_model = os.path.join(MODEL_FOLDER, "face_model_final.keras")
        model.save(new_model)

        # 保存类别
        with open(os.path.join(MODEL_FOLDER, "classes.txt"), "w", encoding="utf-8") as f:
            f.write("\n".join(classes))

        print("\n🎉 训练完成！模型已保存到：models/face_model_final.keras")

    except Exception as e:
        print("\n❌ 训练失败：")
        print(f"错误：{str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    train()