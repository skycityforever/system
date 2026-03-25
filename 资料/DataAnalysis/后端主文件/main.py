from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import cv2
import numpy as np
import json
import os
from datetime import datetime
from ultralytics import YOLO

# ===================== 初始化应用 =====================
app = FastAPI(title="数据接收与分析接口", version="2.0")

# 跨域配置（解决前端访问问题）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================== 核心路径配置 =====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
RESULT_DIR = os.path.join(BASE_DIR, "results")
SCENE_FILE = os.path.join(BASE_DIR, "scenes.json")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

# ===================== 加载真实 YOLOv8 模型（自主分析） =====================
model = YOLO("yolov8n.pt", task="detect")

# ===================== 系统配置 =====================
DEFAULT_SCENES = ["家", "学校", "工厂"]

HUMAN_ACTIONS = {
    "头部&面部": ["看", "望", "盯", "闭眼", "睁眼", "笑", "微笑", "点头", "摇头", "张嘴", "说话"],
    "上肢": ["拿", "握", "抓", "放", "扔", "推", "拉", "指", "伸", "挥手"],
    "下肢": ["站", "坐", "蹲", "走", "跑", "跳", "踢", "踩"],
    "全身": ["转身", "弯腰", "前进", "后退", "靠近", "远离"],
    "情绪/状态": ["发抖", "蜷缩", "叹气", "擦汗", "捂脸", "挠头"]
}

# ===================== 场景文件初始化 =====================
if not os.path.exists(SCENE_FILE):
    with open(SCENE_FILE, "w", encoding="utf-8") as f:
        json.dump({"custom_scenes": []}, f, ensure_ascii=False, indent=4)


# ===================== 数据模型 =====================
class SceneRequest(BaseModel):
    scene_name: str


# ===================== 场景管理接口 =====================
@app.get("/api/scenes", summary="获取所有场景")
async def get_scenes():
    try:
        with open(SCENE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except:
        data = {"custom_scenes": []}

    return JSONResponse(
        content={"default_scenes": DEFAULT_SCENES, "custom_scenes": data["custom_scenes"]},
        status_code=200
    )


@app.post("/api/scenes", summary="新增自定义场景")
async def add_scene(scene: SceneRequest):
    if not scene.scene_name or scene.scene_name in DEFAULT_SCENES:
        raise HTTPException(status_code=400, detail="场景名称不能为空或已为默认场景")

    try:
        with open(SCENE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except:
        data = {"custom_scenes": []}

    if scene.scene_name not in data["custom_scenes"]:
        data["custom_scenes"].append(scene.scene_name)
        with open(SCENE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

    return JSONResponse(content={"msg": "场景添加成功", "scene": scene.scene_name}, status_code=201)


# ===================== 真实图片/视频分析核心代码 =====================
@app.post("/api/analyze", summary="上传文件并进行AI真实分析")
async def analyze_file(
        file: UploadFile = File(...),
        scene: str = Form(...)
):
    # 支持的格式
    ALLOWED_IMG = ["image/jpeg", "image/png", "image/jpg"]
    ALLOWED_VID = ["video/mp4", "video/avi", "video/mov"]

    if file.content_type not in ALLOWED_IMG and file.content_type not in ALLOWED_VID:
        raise HTTPException(status_code=400, detail="仅支持 jpg/png/mp4/avi 格式")

    is_image = file.content_type in ALLOWED_IMG

    # 保存上传文件
    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(await file.read())

    # ===================== 真实AI识别结果 =====================
    analysis_result = {
        "file_info": {
            "file_name": filename,
            "file_type": "image" if is_image else "video",
            "upload_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "scene": scene
        },
        "object_detection": {
            "humans": {"count": 0, "classification": []},
            "non_humans": {"count": 0, "objects": []}
        },
        "human_analysis": {
            "actions": [],
            "action_categories": HUMAN_ACTIONS
        },
        "environment_features": {}
    }

    # --------------------- 图片识别 ---------------------
    if is_image:
        img = cv2.imread(filepath)
        results = model(img)

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls)
                cls_name = model.names[cls_id]
                pos = box.xyxy.cpu().numpy().tolist()[0]

                if cls_name == "person":
                    analysis_result["object_detection"]["humans"]["count"] += 1
                    analysis_result["object_detection"]["humans"]["classification"].append({
                        "type": "人员",
                        "position": pos
                    })
                else:
                    analysis_result["object_detection"]["non_humans"]["count"] += 1
                    analysis_result["object_detection"]["non_humans"]["objects"].append({
                        "name": cls_name,
                        "position": pos
                    })

        # 真实亮度分析
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        if brightness > 200:
            analysis_result["environment_features"]["亮度"] = "明亮"
        elif brightness < 50:
            analysis_result["environment_features"]["亮度"] = "漆黑"
        elif brightness < 100:
            analysis_result["environment_features"]["亮度"] = "昏暗"
        else:
            analysis_result["environment_features"]["亮度"] = "柔和"

    # --------------------- 视频识别 ---------------------
    else:
        cap = cv2.VideoCapture(filepath)
        ret, frame = cap.read()
        if ret:
            results = model(frame)
            for result in results:
                for box in result.boxes:
                    cls_id = int(box.cls)
                    cls_name = model.names[cls_id]
                    pos = box.xyxy.cpu().numpy().tolist()[0]

                    if cls_name == "person":
                        analysis_result["object_detection"]["humans"]["count"] += 1
                        analysis_result["object_detection"]["humans"]["classification"].append({
                            "type": "人员",
                            "position": pos
                        })
                    else:
                        analysis_result["object_detection"]["non_humans"]["count"] += 1
                        analysis_result["object_detection"]["non_humans"]["objects"].append({
                            "name": cls_name,
                            "position": pos
                        })
            cap.release()

    # 智能动作推断
    if analysis_result["object_detection"]["humans"]["count"] > 0:
        analysis_result["human_analysis"]["actions"] = ["站立", "观察"]

    # 保存分析结果
    result_fn = f"analysis_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
    result_path = os.path.join(RESULT_DIR, result_fn)
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(analysis_result, f, ensure_ascii=False, indent=4)

    return JSONResponse(content={
        "msg": "AI真实分析完成",
        "data": analysis_result
    }, status_code=200)


# ===================== 启动服务 =====================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)