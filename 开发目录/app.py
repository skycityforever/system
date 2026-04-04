from datetime import datetime, timedelta
import os
import sys
import uuid
import glob
import cv2
import numpy as np
import onnxruntime
import psutil
import json
import string
import random
import pynvml
from flask import Flask, request, jsonify, send_from_directory, render_template, session, redirect, url_for
from flask_cors import CORS

# ==========================
# 模型导入
# ==========================
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from detection.YOLOV11 import yolov11_detect
from detection.yolo11_pos.yolov11_pose_detect import yolov11_pose_detect
from detection.rt_detr.rtdetr_detect import rtdetr_detect
from detection.Person_Age_Detection.gad import AgeGenderDetector

# ==========================
# 蓝图导入（路由包）
# ==========================
from Route_Forwarding import main_bp

# ==========================
# 数据传输蓝图
# ==========================
from data_transport.device_transport import device_transport_bp
from data_transport.model_transport import model_transport_bp
from data_transport.detection_transport import (
    save_detection_record,
    get_all_detection_records,
    update_detection_record_llm
)
from data_transport.visual_dashboard_api import dashboard_bp
from data_transport.data_collection_transport import (
    save_collection_data,
    get_all_collection_data,
    get_collection_data_by_scene
)

# ==========================
# LLM集成
# ==========================
from llm_integration.llm_client import DoubaoEnvironmentAnalyzer

# ==========================
# 数据库集成
# ==========================

try:
    from database_controller.database_controller import (
        get_db_connection,
        insert_detection_record,
        import_detection_records,
        import_devices,
        import_models,
        import_users,
        import_login_logs
    )
    DB_ENABLED = True
    print("✅ 数据库模块加载成功 → 自动同步 JSON → SQLite")
except Exception as e:
    DB_ENABLED = False
    print(f"⚠️ 数据库未启用：{str(e)}")

# ==========================
# GPU监控
# ==========================
try:
    import pynvml
    pynvml.nvmlInit()
    gpu_available = True
except:
    gpu_available = False

# ==========================
# Flask初始化
# ==========================
app = Flask(__name__,
            static_folder='static',
            template_folder='templates'
            )

# ==========================
# 核心安全配置
# ==========================
app.secret_key = os.urandom(24)
app.permanent_session_lifetime = timedelta(days=2)
CORS(app, supports_credentials=True)

# ==========================
# 注册蓝图（关键！）
# ==========================
from Route_Forwarding import register_routes
register_routes()  # 延迟注册
app.register_blueprint(main_bp)  # 页面+API路由
app.register_blueprint(device_transport_bp)
app.register_blueprint(model_transport_bp)
app.register_blueprint(dashboard_bp)

# ==========================
# 全局变量（供路由模块使用）
# ==========================
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
RESULT_FOLDER = os.path.join(os.path.dirname(__file__), 'runs', 'detect')
MODEL_PATH = os.path.join(os.path.dirname(__file__), './detection/model_pt/yolo11s.pt')
C2PNET_ONNX_PATH = os.path.join(
    os.path.dirname(__file__),
    "./detection/C2PNet-onnxrun-main/C2PNet-onnxrun-main/weights/c2pnet_outdoor_640x640.onnx"
)
RTDETR_MODEL_PATH = os.path.join(os.path.dirname(__file__), './detection/model_pt/rtdetr-l.pt')
YOLOV11_POSE_MODEL_PATH = os.path.join(os.path.dirname(__file__), './detection/model_pt/yolo11s-pose.pt')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# ==========================
# 模型初始化
# ==========================
class C2PNet:
    def __init__(self, modelpath):
        self.onnx_session = onnxruntime.InferenceSession(modelpath)
        self.input_name = self.onnx_session.get_inputs()[0].name
        _, _, self.input_height, self.input_width = self.onnx_session.get_inputs()[0].shape

    def detect(self, image):
        input_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        if isinstance(self.input_height, int) and isinstance(self.input_width, int):
            input_image = cv2.resize(input_image, (self.input_width, self.input_height))
        input_image = input_image.astype(np.float32) / 255.0
        input_image = input_image.transpose(2, 0, 1)
        input_image = np.expand_dims(input_image, axis=0)

        result = self.onnx_session.run(None, {self.input_name: input_image})

        output_image = np.squeeze(result[0])
        output_image = output_image.transpose(1, 2, 0)
        output_image = output_image * 255
        output_image = np.clip(output_image, 0, 255).astype(np.uint8)
        output_image = cv2.cvtColor(output_image, cv2.COLOR_RGB2BGR)
        output_image = cv2.resize(output_image, (image.shape[1], image.shape[0]))
        return output_image

c2pnet = C2PNet(C2PNET_ONNX_PATH)
age_gender_detector = AgeGenderDetector()

# ==========================
# LLM初始化
# ==========================
llm_analyzer = DoubaoEnvironmentAnalyzer(
    api_url="https://metaso.cn/api/v1/chat/completions",
    api_key="mk-7925AE7CBDE52565CD3535FECAAC9172"
)

# ==========================
# 登录验证装饰器（全局可用）
# ==========================
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            if request.path.startswith('/api/') and not request.path.startswith(
                    '/api/verify-login') and not request.path.startswith(
                    '/api/register') and not request.path.startswith('/api/generate-code'):
                return jsonify({"success": False, "msg": "请先登录！", "need_login": True}), 401
            else:
                return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

# ==========================
# 启动时同步数据库
# ==========================
if DB_ENABLED:
    try:
        print("\n🚀 系统启动 → 自动同步 JSON → SQLite...")
        import_detection_records()
        import_devices()
        import_models()
        import_users()
        import_login_logs()
        print("✅ 数据库初始化完成\n")
    except Exception as e:
        print(f"⚠️ 同步失败：{e}\n")

# ==========================
# 启动服务
# ==========================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)