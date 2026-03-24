# 导入必要的库
import cvzone
from cvzone.FaceDetectionModule import FaceDetector
import cv2

# 初始化摄像头
# 通常 '0' 指的是内置摄像头
cap = cv2.VideoCapture(0)

# 初始化FaceDetector对象
# minDetectionCon: 最小检测置信度阈值
# modelSelection: 0 表示短距离检测（2米），1 表示长距离检测（5米）
detector = FaceDetector(minDetectionCon=0.5, modelSelection=0)

# 循环获取摄像头帧
while True:
    # 从摄像头读取当前帧
    # success: 布尔值，表示是否成功捕获了帧
    # img: 捕获的帧
    success, img = cap.read()

    # 在图像中检测人脸
    # img: 更新后的图像
    # bboxs: 检测到的人脸边界框列表
    img, bboxs = detector.findFaces(img, draw=False)

    # 如果检测到人脸
    if bboxs:
        # 遍历每个边界框
        for bbox in bboxs:
            # bbox 包含 'id', 'bbox', 'score', 'center'

            # ---- 获取数据 ---- #
            center = bbox["center"]  # 中心点坐标
            x, y, w, h = bbox['bbox']  # 边界框坐标和大小
            score = int(bbox['score'][0] * 100)  # 识别置信度（百分比）

            # ---- 绘制数据 ---- #
            cv2.circle(img, center, 5, (255, 0, 255), cv2.FILLED)  # 画出圆形标记人脸中心
            cvzone.putTextRect(img, f'{score}%', (x, y - 15), border=5)  # 显示识别置信度文本
            cvzone.cornerRect(img, (x, y, w, h))  # 画出矩形框

    # 在名为'Image'的窗口中显示图像
    cv2.imshow("Image", img)
    # 等待1毫秒，如果按下任意键则关闭窗口
    cv2.waitKey(1)
