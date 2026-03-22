import json
import os
import uuid
from datetime import datetime

# 日志文件路径（log/detection_records.json）
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'log')
RECORD_FILE = os.path.join(LOG_DIR, 'detection_records.json')

# 确保log目录存在
os.makedirs(LOG_DIR, exist_ok=True)

def save_detection_record(detect_type, detect_results, llm_suggestion=""):
    """
    保存检测记录到JSON文件
    :param detect_type: 检测类型（图片/视频/摄像头）
    :param detect_results: 检测结果列表，每个元素包含class、confidence
    :param llm_suggestion: 大模型建议（可选）
    :return: 生成的记录ID
    """
    # 生成记录
    record = {
        "id": str(uuid.uuid4()),
        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "detect_type": detect_type,
        "detect_results": detect_results,
        "llm_suggestion": llm_suggestion
    }

    # 读取现有记录（如果文件不存在则初始化空列表）
    records = []
    if os.path.exists(RECORD_FILE):
        with open(RECORD_FILE, 'r', encoding='utf-8') as f:
            try:
                records = json.load(f)
            except json.JSONDecodeError:
                records = []

    # 追加新记录
    records.append(record)

    # 写回文件
    with open(RECORD_FILE, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    return record["id"]

def update_detection_record_llm(record_id, new_llm_suggestion):
    """
    根据记录ID更新大模型建议
    :param record_id: 要更新的记录ID
    :param new_llm_suggestion: 新的大模型建议文本
    :return: 是否更新成功
    """
    if not os.path.exists(RECORD_FILE):
        return False

    with open(RECORD_FILE, 'r', encoding='utf-8') as f:
        try:
            records = json.load(f)
        except json.JSONDecodeError:
            records = []

    updated = False
    for record in records:
        if record["id"] == record_id:
            record["llm_suggestion"] = new_llm_suggestion
            updated = True
            break

    if updated:
        with open(RECORD_FILE, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
    return updated

def get_all_detection_records():
    """获取所有检测记录"""
    if not os.path.exists(RECORD_FILE):
        return []
    with open(RECORD_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []