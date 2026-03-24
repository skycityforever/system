from flask import Blueprint, jsonify
import random
from datetime import datetime

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/weather")
def weather():
    temp = round(random.uniform(5, 35), 1)
    humidity = random.randint(20, 90)
    pressure = random.randint(980, 1050)
    aqi = random.randint(0, 150)
    vis = round(random.uniform(100, 9000), 2)
    wind_dir = random.randint(0, 360)
    wind = round(random.uniform(0, 20), 1)

    if vis > 6000:
        grade = "green"
        layer = "气象卫星云图"
    elif vis > 3000:
        grade = "yellow"
        layer = "多云监测"
    elif vis > 800:
        grade = "orange"
        layer = "降雨云图"
    else:
        grade = "red"
        layer = "极端气象预警"

    trend = [round(random.uniform(0, 20), 1) for _ in range(8)]
    return jsonify({
        "grade": grade,
        "layer": layer,
        "temp": temp,
        "humidity": humidity,
        "pressure": pressure,
        "aqi": aqi,
        "vis": vis,
        "dir": wind_dir,
        "wind": wind,
        "trend": trend
    })

@dashboard_bp.route("/alerts")
def alerts():
    alerts = []
    if random.random() > 0.6:
        alerts.append(f"【告警】{random.choice(['区域降雨','大风','低温','异常人员'])} 已触发")
    if random.random() > 0.7:
        alerts.append(f"【设备】传感器 {random.choice(['#1','#2','#3'])} 数据波动")
    return jsonify(alerts)

@dashboard_bp.route("/abnormal")
def abnormal():
    has_extreme = random.random() > 0.7
    show = random.random() > 0.7
    types = ["人员滞留", "人员倒地", "禁区闯入"]
    return jsonify({
        "show": show and has_extreme,
        "extreme": has_extreme,
        "type": random.choice(types) if show else "无",
        "loc": f"东经{round(random.uniform(114,116),4)}，北纬{round(random.uniform(27,29),4)}",
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })