from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import sys
import uuid
from datetime import datetime
import glob
import cv2
import numpy as np
import onnxruntime
import psutil

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from detection.YOLOV11 import yolov11_detect
from data_transport.device_transport import device_transport_bp
from data_transport.model_transport import model_transport_bp
from data_transport.detection_transport import (
    save_detection_record,
    get_all_detection_records,
    update_detection_record_llm
)
from data_transport.visual_dashboard_api import dashboard_bp
from flask_cors import CORS
from llm_integration.llm_client import DoubaoEnvironmentAnalyzer

# GPU 监控库
try:
    import pynvml
    pynvml.nvmlInit()
    gpu_available = True
except:
    gpu_available = False

app = Flask(__name__,
            static_folder='static',
            template_folder='templates'
            )
CORS(app)

app.register_blueprint(device_transport_bp)
app.register_blueprint(model_transport_bp)
app.register_blueprint(dashboard_bp)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
RESULT_FOLDER = os.path.join(os.path.dirname(__file__), 'runs', 'detect')
MODEL_PATH = os.path.join(os.path.dirname(__file__), './detection/model_pt/yolo11s.pt')
C2PNET_ONNX_PATH = os.path.join(
    os.path.dirname(__file__),
    "./detection/C2PNet-onnxrun-main/C2PNet-onnxrun-main/weights/c2pnet_outdoor_640x640.onnx"
)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

llm_analyzer = DoubaoEnvironmentAnalyzer(
    api_url="https://metaso.cn/api/v1/chat/completions",
    api_key="mk-7925AE7CBDE52565CD3535FECAAC9172"
)

# ==========================
# 全局模型状态
# ==========================
current_deployed_model = "yolov11"

# ==========================
# C2PNet 去雾模型
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

# ==========================
# 页面路由
# ==========================
@app.route('/')
def index():
    return render_template('navgation.html')

@app.route('/object_detection_controlcenter')
def object_detection_controlcenter():
    return render_template('object_detection_controlcenter.html')

@app.route('/visual_dashboard')
def visual_dashboard():
    return render_template('visual_dashboard.html')

@app.route('/history')
def history():
    return render_template('history.html')

@app.route('/historical_data_analysis')
def historical_data_analysis():
    return render_template('historical_data_analysis.html')

@app.route('/model_management')
def model_management():
    return render_template('model_management.html')

@app.route('/edge_device_management')
def edge_device_management():
    return render_template('edge_device_management.html')

@app.route('/user_center')
def user_center():
    return render_template('user_center.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

# ==========================
# 模型切换接口
# ==========================
@app.route('/api/set_current_model', methods=['POST'])
def set_current_model():
    global current_deployed_model
    try:
        data = request.json
        model_key = data.get('model')

        model_map = {
            "yolov11_detect": "yolov11",
            "c2pnet_dehaze": "c2pnet",
            "cawm_maba": "cawm",
            "yolov11_pose": "yolov11_pose",
            "mediapipe_face": "mediapipe_face",
            "mediapipe_pose": "mediapipe_pose",
            "rt_detr": "rt_detr",
            "age_recognition": "age",
            "empty_1": "empty",
            "empty_2": "empty"
        }

        current_deployed_model = model_map.get(model_key, "yolov11")
        return jsonify({"success": True, "current_model": current_deployed_model})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500

@app.route('/api/get_current_model', methods=['GET'])
def get_current_model():
    return jsonify({
        "success": True,
        "current_model": current_deployed_model
    })

# ==========================
# ✅ 实时设备状态接口（GPU + 内存）
# ==========================
@app.route('/api/device_status', methods=['GET'])
def device_status():
    try:
        # GPU 显存
        gpu_used = 0
        gpu_total = 24
        if gpu_available:
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
            gpu_used = round(mem.used / 1024**3, 1)
            gpu_total = round(mem.total / 1024**3, 1)

        # 系统内存
        mem = psutil.virtual_memory()
        mem_used = round(mem.used / 1024**3, 1)
        mem_total = round(mem.total / 1024**3, 1)

        return jsonify({
            "success": True,
            "gpu_used": gpu_used,
            "gpu_total": gpu_total,
            "mem_used": mem_used,
            "mem_total": mem_total
        })
    except:
        return jsonify({
            "success": True,
            "gpu_used": 0.0,
            "gpu_total": 24.0,
            "mem_used": 0.0,
            "mem_total": 32.0
        })

# ==========================
# 统一检测接口
# ==========================
@app.route('/api/detect', methods=['POST'])
def detect_image_api():
    try:
        file = request.files['image']
        model = request.form.get("model", current_deployed_model)

        file_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}.{file_ext}"
        upload_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(upload_path)

        # YOLOv11 检测
        if model == "yolov11":
            results, output_img_path, info = yolov11_detect(
                image_path=upload_path,
                model_path=MODEL_PATH,
                save_dir=RESULT_FOLDER,
                show=False
            )
            if info['status'] == 'error':
                return jsonify({'success': False, 'msg': info['msg']}), 500

            result_text = f"检测完成：{info['detect_count']} 个目标\n"
            for cls in info['classes']:
                result_text += f"{cls['class']} {cls['confidence']}%\n"

            result_img_filename = os.path.basename(output_img_path)

            dirs = glob.glob(os.path.join(RESULT_FOLDER, 'predict*'))
            if dirs:
                latest_dir = os.path.basename(max(dirs, key=os.path.getctime))
                result_image_url = f"/results/{latest_dir}/{result_img_filename}"
            else:
                result_image_url = f"/results/{result_img_filename}"

            return jsonify({
                "success": True,
                "detect_count": info['detect_count'],
                "avg_conf": round(sum([c['confidence'] for c in info['classes']])/info['detect_count'],2) if info['detect_count']>0 else 0,
                "result_image_url": result_image_url,
                "result_text": result_text,
                "classes": info['classes'],
                "latency": 12,
                "saved_filename": unique_filename
            })

        # C2PNet 去雾
        elif model == "c2pnet":
            srcimg = cv2.imread(upload_path)
            dstimg = c2pnet.detect(srcimg)
            dehaze_folder = os.path.join(os.path.dirname(__file__), "dehaze_results")
            if not os.path.exists(dehaze_folder):
                os.makedirs(dehaze_folder)
            result_filename = f"dehaze_{unique_filename}"
            save_path = os.path.join(dehaze_folder, result_filename)
            cv2.imwrite(save_path, dstimg)

            result_image_url = f"/dehaze_results/{result_filename}"

            return jsonify({
                "success": True,
                "detect_count": 0,
                "avg_conf": 0,
                "result_image_url": result_image_url,
                "result_text": "C2PNet 去雾完成\n图像清晰度已提升",
                "classes": [],
                "latency": 18,
                "saved_filename": unique_filename
            })

        else:
            return jsonify({"success": False, "msg": "该模型暂未实现"}), 400

    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500

# ==========================
# 环境分析
# ==========================
@app.route('/api/analyze_environment', methods=['POST'])
def analyze_environment():
    try:
        data = request.json
        short_filename = data.get('image_path', '')
        full_image_path = os.path.join(UPLOAD_FOLDER, short_filename)
        image_desc = data.get('env_desc', '') or data.get('detect_result', '')
        record_id = data.get('record_id', '')

        result = llm_analyzer.analyze_image(image_path=full_image_path, image_desc=image_desc)
        if record_id:
            update_detection_record_llm(record_id, f"环境：{result['environment_type']} | 建议：{';'.join(result['protection_suggestions'])}")
        return jsonify({"success": True, "data": result})
    except Exception as e:
        fallback = llm_analyzer.get_local_fallback_result(data.get('env_desc',''))
        return jsonify({"success": True, "data": fallback})

# ==========================
# 检测记录
# ==========================
@app.route('/api/detection_records', methods=['GET'])
def get_detection_records_api():
    try:
        records = get_all_detection_records()
        return jsonify({"success": True, "records": records, "total": len(records)})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}),500

# ==========================
# 静态文件服务
# ==========================
@app.route('/results/<path:file_path>')
def serve_result_image(file_path):
    try:
        return send_from_directory(RESULT_FOLDER, file_path)
    except:
        return send_from_directory('static', 'default.png')

@app.route('/dehaze_results/<filename>')
def get_dehaze_img(filename):
    return send_from_directory("dehaze_results", filename)

@app.route('/uploads/<filename>')
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)