import sqlite3
import json
import os
from datetime import datetime

# ==========================
# 路径配置（和你项目结构完全匹配）
# ==========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "polar_guard.db")
LOG_DIR = os.path.join(os.path.dirname(BASE_DIR), "log")

# ==========================
# 1. 数据库连接
# ==========================
def get_db_connection():
    """获取数据库连接（自动创建目录和库）"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # 支持字典式访问
    return conn

# ==========================
# 2. 建表 SQL（全部 6 张表）
# ==========================
def create_all_tables():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 表1：检测记录（detection_records.json）
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS detection_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id TEXT UNIQUE,
        detect_time TEXT,
        detect_type TEXT,
        detect_results TEXT,  -- JSON 字符串存储目标列表
        llm_suggestion TEXT,
        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 表2：设备信息（devices.json）
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT UNIQUE,
        device_name TEXT,
        ip_address TEXT,
        device_type TEXT,
        location TEXT,
        environment TEXT,
        description TEXT,
        activate_time TEXT,
        total_usage_hours TEXT,
        status TEXT,
        submit_time TEXT
    )
    ''')

    # 表3：模型信息（models.json）
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_name TEXT,
        version TEXT,
        device TEXT,
        size REAL,
        infer_time REAL,
        accuracy REAL,
        env TEXT,
        desc TEXT,
        upload_time TEXT,
        status TEXT,
        load_time TEXT
    )
    ''')

    # 表4：用户账号（users.json）
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,  -- 建议存储哈希值
        role TEXT,      -- admin/user/guest
        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 表5：用户登录日志（新增）
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_login_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        device_info TEXT,
        status TEXT,  -- success/failed
        FOREIGN KEY (username) REFERENCES users(username)
    )
    ''')

    # 表6：用户个人信息（新增）
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        nickname TEXT,
        avatar TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username)
    )
    ''')

    conn.commit()
    conn.close()
    print("✅ 6 张核心数据表已创建完成")

# ==========================
# 3. JSON 数据导入函数
# ==========================
def import_detection_records():
    """导入 detection_records.json"""
    path = os.path.join(LOG_DIR, "detection_records.json")
    if not os.path.exists(path):
        print("⚠️ detection_records.json 不存在")
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    conn = get_db_connection()
    cursor = conn.cursor()
    for item in data:
        cursor.execute('''
        INSERT OR REPLACE INTO detection_records
        (record_id, detect_time, detect_type, detect_results, llm_suggestion)
        VALUES (?, ?, ?, ?, ?)
        ''', (
            item.get("id"),
            item.get("detect_time"),
            item.get("detect_type"),
            json.dumps(item.get("detect_results", [])),
            item.get("llm_suggestion")
        ))
    conn.commit()
    conn.close()
    print(f"✅ 导入 {len(data)} 条检测记录")

def import_devices():
    """导入 devices.json"""
    path = os.path.join(LOG_DIR, "devices.json")
    if not os.path.exists(path):
        print("⚠️ devices.json 不存在")
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    conn = get_db_connection()
    cursor = conn.cursor()
    for item in data:
        cursor.execute('''
        INSERT OR REPLACE INTO devices
        (device_id, device_name, ip_address, device_type, location, environment, description, activate_time, total_usage_hours, status, submit_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item.get("device_id"),
            item.get("device_name"),
            item.get("ip_address"),
            item.get("device_type"),
            item.get("location"),
            item.get("environment"),
            item.get("description"),
            item.get("activate_time"),
            item.get("total_usage_hours"),
            item.get("status"),
            item.get("submit_time")
        ))
    conn.commit()
    conn.close()
    print(f"✅ 导入 {len(data)} 条设备数据")

def import_models():
    """导入 models.json"""
    path = os.path.join(LOG_DIR, "models.json")
    if not os.path.exists(path):
        print("⚠️ models.json 不存在")
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    conn = get_db_connection()
    cursor = conn.cursor()
    for item in data:
        cursor.execute('''
        INSERT OR REPLACE INTO models
        (model_name, version, device, size, infer_time, accuracy, env, desc, upload_time, status, load_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item.get("modelName"),
            item.get("version"),
            item.get("device"),
            item.get("size"),
            item.get("inferTime"),
            item.get("accuracy"),
            item.get("env"),
            item.get("desc"),
            item.get("uploadTime"),
            item.get("status"),
            item.get("loadTime")
        ))
    conn.commit()
    conn.close()
    print(f"✅ 导入 {len(data)} 条模型数据")

def import_users():
    """导入 users.json"""
    path = os.path.join(LOG_DIR, "users.json")
    if not os.path.exists(path):
        print("⚠️ users.json 不存在")
        return
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    conn = get_db_connection()
    cursor = conn.cursor()
    for item in data:
        cursor.execute('''
        INSERT OR REPLACE INTO users
        (username, password, role)
        VALUES (?, ?, ?)
        ''', (
            item.get("username"),
            item.get("password"),
            item.get("role", "user")
        ))
        # 同步创建个人信息
        cursor.execute('''
        INSERT OR REPLACE INTO user_profiles
        (username, nickname, avatar, phone, email, address)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            item.get("username"),
            item.get("nickname", item.get("username")),
            item.get("avatar", ""),
            item.get("phone", ""),
            item.get("email", ""),
            item.get("address", "")
        ))
    conn.commit()
    conn.close()
    print(f"✅ 导入 {len(data)} 条用户数据")

# ==========================
# 4. 核心 CRUD 接口（给 Flask 调用）
# ==========================

# --- 检测记录 ---
def insert_detection_record(record):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO detection_records
    (record_id, detect_time, detect_type, detect_results, llm_suggestion)
    VALUES (:record_id, :detect_time, :detect_type, :detect_results, :llm_suggestion)
    ''', record)
    conn.commit()
    conn.close()

# --- 设备管理 ---
def update_device_status(device_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE devices SET status = ? WHERE device_id = ?
    ''', (status, device_id))
    conn.commit()
    conn.close()

# --- 模型管理 ---
def update_model_status(model_name, status, load_time):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE models SET status = ?, load_time = ? WHERE model_name = ?
    ''', (status, load_time, model_name))
    conn.commit()
    conn.close()

# --- 用户登录 ---
def record_user_login(username, ip, device_info, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO user_login_logs
    (username, ip_address, device_info, status)
    VALUES (?, ?, ?, ?)
    ''', (username, ip, device_info, status))
    conn.commit()
    conn.close()

# ==========================
# 5. 初始化入口
# ==========================
if __name__ == "__main__":
    create_all_tables()
    import_detection_records()
    import_devices()
    import_models()
    import_users()
    print("🎉 数据库初始化完成！所有 JSON 已导入 SQLite")