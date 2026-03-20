from flask import Blueprint, request, jsonify
import json
import os
from datetime import datetime

# 创建模型管理蓝图
model_transport_bp = Blueprint('model_transport', __name__)

# 定义 JSON 存储路径（和 devices.json 同目录）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 开发目录
JSON_DIR = os.path.join(BASE_DIR, 'log')
MODEL_JSON_PATH = os.path.join(JSON_DIR, "models.json")

# 确保 log 目录存在
os.makedirs(JSON_DIR, exist_ok=True)

def load_models():
    """加载已存储的模型数据"""
    if not os.path.exists(MODEL_JSON_PATH):
        return []
    with open(MODEL_JSON_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_models(models):
    """保存模型数据到 JSON 文件"""
    with open(MODEL_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(models, f, ensure_ascii=False, indent=2)

@model_transport_bp.route('/api/model/upload', methods=['POST'])
def upload_model():
    """接收前端表单数据并存储为 JSON"""
    try:
        # 1. 获取前端表单数据
        data = request.get_json()
        model_name = data.get('modelName')
        version = data.get('version')
        device = data.get('device')
        size = data.get('size')
        infer_time = data.get('inferTime')
        accuracy = data.get('accuracy')
        env = data.get('env')
        desc = data.get('desc', '')

        # 2. 校验必填字段
        if not all([model_name, version, device, size, infer_time, accuracy, env]):
            return jsonify({"code": 400, "msg": "请填写完整模型信息"}), 400

        # 3. 构造模型数据（补充上传时间）
        model_data = {
            "modelName": model_name,
            "version": version,
            "device": device,
            "size": float(size),
            "inferTime": float(infer_time),
            "accuracy": float(accuracy),
            "env": env,
            "desc": desc,
            "uploadTime": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "unloaded"  # 默认未加载状态
        }

        # 4. 加载已有数据并追加
        models = load_models()
        models.append(model_data)
        save_models(models)

        return jsonify({
            "code": 200,
            "msg": "模型信息上传成功",
            "data": model_data
        }), 200

    except Exception as e:
        return jsonify({"code": 500, "msg": f"服务器错误: {str(e)}"}), 500

@model_transport_bp.route('/api/model/list', methods=['GET'])
def get_model_list():
    """获取所有模型列表（供前端加载卡片使用）"""
    models = load_models()
    return jsonify({
        "code": 200,
        "msg": "获取成功",
        "data": models
    }), 200

@model_transport_bp.route('/api/model/<model_name>/status', methods=['PUT'])
def update_model_status(model_name):
    """更新模型状态（加载/重启/卸载）"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        if new_status not in ["loaded", "unloaded", "restarting"]:
            return jsonify({"code": 400, "msg": "无效状态"}), 400

        models = load_models()
        found = False
        for model in models:
            if model["modelName"] == model_name:
                model["status"] = new_status
                if new_status == "loaded":
                    model["loadTime"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                found = True
                break
        if not found:
            return jsonify({"code": 404, "msg": "模型不存在"}), 404

        save_models(models)
        return jsonify({"code": 200, "msg": "状态更新成功"}), 200

    except Exception as e:
        return jsonify({"code": 500, "msg": f"服务器错误: {str(e)}"}), 500