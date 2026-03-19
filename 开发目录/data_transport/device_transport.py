import json
import os
from datetime import datetime
from flask import Blueprint, request, jsonify

from 开发目录.app import app

# 创建蓝图
device_transport_bp = Blueprint('device_transport', __name__)

# 确保 log 目录存在
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../log')
os.makedirs(LOG_DIR, exist_ok=True)
DEVICE_LOG_FILE = os.path.join(LOG_DIR, 'devices.json')


def save_device_to_json(device_data):
    """将设备信息保存到 log/devices.json"""
    # 如果文件不存在，初始化空列表
    if not os.path.exists(DEVICE_LOG_FILE):
        with open(DEVICE_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=4)

    # 读取现有数据
    with open(DEVICE_LOG_FILE, 'r', encoding='utf-8') as f:
        devices = json.load(f)

    # 添加新设备数据
    devices.append(device_data)

    # 写回文件
    with open(DEVICE_LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(devices, f, ensure_ascii=False, indent=4)


@app.route('/api/device/register', methods=['POST'])
def register_device():
    try:
        device_data = request.get_json()
        if not device_data:
            return jsonify({"status": "error", "msg": "未收到设备数据"}), 400

        # 保存到 JSON
        save_device_to_json(device_data)
        return jsonify({"status": "success", "msg": "设备注册成功"})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500