from flask import Blueprint, jsonify, request
from 开发目录.alert_system.alert_system import ExtremeWeatherAlertSystem
import os

# 创建预警系统蓝图（适配现有Route_Forwarding架构）
alert_bp = Blueprint('alert', __name__)

# 初始化预警系统（日志目录对接项目log目录）
alert_system = ExtremeWeatherAlertSystem(
    log_dir=os.path.join(os.path.dirname(__file__), "..", "log")
)

# ==========================
# 预警相关API接口
# ==========================
@alert_bp.route('/api/alert/status', methods=['GET'])
def get_alert_status():
    """获取当前预警状态（前端仪表盘调用）"""
    location = request.args.get('location', '未知位置')
    status = alert_system.get_current_alert_status(location)
    return jsonify({"success": True, "data": status})

@alert_bp.route('/api/alert/history', methods=['GET'])
def get_alert_history():
    """获取预警历史（历史页面调用）"""
    limit = int(request.args.get('limit', 50))
    history = alert_system.get_alert_history(limit)
    return jsonify({"success": True, "data": history, "total": len(history)})

@alert_bp.route('/api/alert/trigger', methods=['POST'])
def trigger_manual_alert():
    """手动触发预警（管理员操作）"""
    data = request.get_json()
    weather_data = data.get('weather_data', {})
    location = data.get('location', '未知位置')

    # 异步执行预警流程
    import asyncio
    asyncio.run(alert_system.monitor_and_alert(weather_data, location))

    return jsonify({"success": True, "msg": "预警已触发"})