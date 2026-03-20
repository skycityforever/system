import json
import os
from datetime import datetime
from flask import Blueprint, request, jsonify

# 1. 创建蓝图（不再直接导入app）
device_transport_bp = Blueprint('device_transport', __name__)

# 2. 定义 log 目录路径（使用绝对路径避免歧义）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 开发目录
LOG_DIR = os.path.join(BASE_DIR, 'log')
os.makedirs(LOG_DIR, exist_ok=True)
DEVICE_LOG_FILE = os.path.join(LOG_DIR, 'devices.json')


# 3. 保存设备信息到 JSON 的核心函数
def save_device_to_json(device_data):
    """将设备信息追加保存到 log/devices.json"""
    # 初始化空列表（如果文件不存在）
    if not os.path.exists(DEVICE_LOG_FILE):
        with open(DEVICE_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=4)

    # 读取现有数据 + 追加新数据
    try:
        with open(DEVICE_LOG_FILE, 'r', encoding='utf-8') as f:
            devices = json.load(f)

        # 给设备添加唯一ID和提交时间（可选，增强数据完整性）
        device_data['submit_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        device_data['id'] = len(devices) + 1

        devices.append(device_data)

        # 写回文件
        with open(DEVICE_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(devices, f, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"保存设备数据失败：{str(e)}")
        return False


# 4. 定义接口（蓝图路由）
@device_transport_bp.route('/api/device/register', methods=['POST'])
def register_device():
    try:
        # 获取前端提交的 JSON 数据
        device_data = request.get_json()
        if not device_data:
            return jsonify({"status": "error", "msg": "未收到设备数据"}), 400

        # 调用保存函数
        if save_device_to_json(device_data):
            return jsonify({"status": "success", "msg": "设备注册成功", "device_id": device_data.get('device_id')})
        else:
            return jsonify({"status": "error", "msg": "保存设备数据失败"}), 500
    except Exception as e:
        return jsonify({"status": "error", "msg": f"服务器错误：{str(e)}"}), 500