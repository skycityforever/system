import json
import os
from datetime import datetime

# 数据采集存储路径
DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "log", "data_collection.json")

def init_data_file():
    """初始化数据文件（自动创建目录和文件）"""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=2)

def save_collection_data(data):
    """保存采集数据到JSON文件"""
    init_data_file()
    # 读取现有数据
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        records = json.load(f)
    # 添加采集时间戳
    data["collect_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    records.append(data)
    # 写入文件
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    return True

def get_all_collection_data():
    """获取所有采集数据"""
    init_data_file()
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def get_collection_data_by_scene(scene):
    """按场景筛选采集数据"""
    all_data = get_all_collection_data()
    return [item for item in all_data if item.get("scene") == scene]