import cv2
import os
import argparse

# 【你要求的：和 main 完全一致写法！】
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)  # 强制切换工作目录到 gad.py 所在文件夹 → 100% 解决路径问题！


def highlightFace(net, frame, conf_threshold=0.7):
    frameOpencvDnn = frame.copy()
    frameHeight = frameOpencvDnn.shape[0]
    frameWidth = frameOpencvDnn.shape[1]
    blob = cv2.dnn.blobFromImage(frameOpencvDnn, 1.0, (300, 300), [104, 117, 123], True, False)

    net.setInput(blob)
    detections = net.forward()
    faceBoxes = []
    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > conf_threshold:
            x1 = int(detections[0, 0, i, 3] * frameWidth)
            y1 = int(detections[0, 0, i, 4] * frameHeight)
            x2 = int(detections[0, 0, i, 5] * frameWidth)
            y2 = int(detections[0, 0, i, 6] * frameHeight)
            faceBoxes.append([x1, y1, x2, y2])
            cv2.rectangle(frameOpencvDnn, (x1, y1), (x2, y2), (0, 255, 0), int(round(frameHeight / 150)), 8)
    return frameOpencvDnn, faceBoxes


class AgeGenderDetector:
    def __init__(self):
        # ==============================================
        # 👇 👇 完全和你 main 里一模一样！无任何修改！
        # ==============================================
        faceProto = "opencv_face_detector.pbtxt"
        faceModel = "opencv_face_detector_uint8.pb"
        ageProto = "age_deploy.prototxt"
        ageModel = "age_net.caffemodel"
        genderProto = "gender_deploy.prototxt"
        genderModel = "gender_net.caffemodel"

        self.face_net = cv2.dnn.readNet(faceModel, faceProto)
        self.age_net = cv2.dnn.readNet(ageModel, ageProto)
        self.gender_net = cv2.dnn.readNet(genderModel, genderProto)

        self.age_list = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)']
        self.gender_list = ['Male', 'Female']
        self.MODEL_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)

    def detect(self, image_path, save_dir):
        try:
            frame = cv2.imread(image_path)
            if frame is None:
                return {"status": "error", "msg": "无法读取图像"}

            h, w = frame.shape[:2]
            blob = cv2.dnn.blobFromImage(frame, 1.0, (300, 300), [104, 117, 123], False, False)
            self.face_net.setInput(blob)
            detections = self.face_net.forward()

            result_info = []
            for i in range(detections.shape[2]):
                confidence = detections[0, 0, i, 2]
                if confidence > 0.7:
                    x1 = int(detections[0, 0, i, 3] * w)
                    y1 = int(detections[0, 0, i, 4] * h)
                    x2 = int(detections[0, 0, i, 5] * w)
                    y2 = int(detections[0, 0, i, 6] * h)
                    face_img = frame[y1:y2, x1:x2]

                    age_blob = cv2.dnn.blobFromImage(face_img, 1.0, (227, 227), self.MODEL_MEAN_VALUES, swapRB=False)
                    self.age_net.setInput(age_blob)
                    age_preds = self.age_net.forward()
                    age = self.age_list[age_preds[0].argmax()]

                    gender_blob = cv2.dnn.blobFromImage(face_img, 1.0, (227, 227), self.MODEL_MEAN_VALUES, swapRB=False)
                    self.gender_net.setInput(gender_blob)
                    gender_preds = self.gender_net.forward()
                    gender = self.gender_list[gender_preds[0].argmax()]

                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
                    label = f"{gender}, {age}"
                    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2,
                                cv2.LINE_AA)

                    result_info.append({
                        "class": f"{gender} {age}",
                        "confidence": round(float(confidence) * 100, 2),
                        "bbox": [x1, y1, x2, y2]
                    })

            os.makedirs(save_dir, exist_ok=True)
            result_filename = f"age_detect_{os.path.basename(image_path)}"
            output_img_path = os.path.join(save_dir, result_filename)
            cv2.imwrite(output_img_path, frame)

            return {
                "status": "success",
                "detect_count": len(result_info),
                "classes": result_info,
                "output_img_path": output_img_path
            }
        except Exception as e:
            return {"status": "error", "msg": str(e)}


# ------------------- 你原来的 main 完全不变 -------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--image')
    args = parser.parse_args()

    faceProto = "opencv_face_detector.pbtxt"
    faceModel = "opencv_face_detector_uint8.pb"
    ageProto = "age_deploy.prototxt"
    ageModel = "age_net.caffemodel"
    genderProto = "gender_deploy.prototxt"
    genderModel = "gender_net.caffemodel"

    faceNet = cv2.dnn.readNet(faceModel, faceProto)
    ageNet = cv2.dnn.readNet(ageModel, ageProto)
    genderNet = cv2.dnn.readNet(genderModel, genderProto)

    video = cv2.VideoCapture(args.image if args.image else 0)
    padding = 20
    while cv2.waitKey(1) < 0:
        hasFrame, frame = video.read()
        if not hasFrame:
            cv2.waitKey()
            break

        resultImg, faceBoxes = highlightFace(faceNet, frame)
        if not faceBoxes:
            print("No face detected")

        for faceBox in faceBoxes:
            face_roi = frame[max(0, faceBox[1] - padding): min(faceBox[3] + padding, frame.shape[0] - 1),
                       max(0, faceBox[0] - padding): min(faceBox[2] + padding, frame.shape[1] - 1)]

            blob_roi = cv2.dnn.blobFromImage(face_roi, 1.0, (227, 227), (78.426, 87.769, 114.896), swapRB=False)
            genderNet.setInput(blob_roi)
            gender = ['Male', 'Female'][genderNet.forward()[0].argmax()]

            ageNet.setInput(blob_roi)
            age = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(25-32)', '(38-43)', '(48-53)', '(60-100)'][
                ageNet.forward()[0].argmax()]

            cv2.putText(resultImg, f'{gender}, {age}', (faceBox[0], faceBox[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                        (0, 255, 255), 2)
            cv2.imshow("Detecting", resultImg)