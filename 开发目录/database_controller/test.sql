-- 1. 检测记录表 (对应 detection_records.json)
CREATE TABLE IF NOT EXISTS detection_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id TEXT UNIQUE NOT NULL COMMENT '检测记录唯一ID',
    detect_time TEXT NOT NULL COMMENT '检测时间',
    detect_type TEXT NOT NULL COMMENT '检测类型（图片/摄像头/去雾等）',
    detect_results TEXT COMMENT '检测结果（JSON字符串存储目标列表）',
    llm_suggestion TEXT COMMENT '大模型环境分析建议',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间'
);

-- 2. 设备信息表 (对应 devices.json)
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL COMMENT '设备唯一ID',
    device_name TEXT NOT NULL COMMENT '设备名称',
    ip_address TEXT COMMENT '设备IP地址',
    device_type TEXT COMMENT '设备类型',
    location TEXT COMMENT '部署位置',
    environment TEXT COMMENT '运行环境',
    description TEXT COMMENT '设备描述',
    activate_time TEXT COMMENT '激活时间',
    total_usage_hours TEXT COMMENT '累计运行时长',
    status TEXT COMMENT '设备状态（在线/离线/故障）',
    submit_time TEXT COMMENT '数据提交时间'
);

-- 3. 模型信息表 (对应 models.json)
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT NOT NULL COMMENT '模型名称',
    version TEXT COMMENT '模型版本',
    device TEXT COMMENT '运行设备（GPU/CPU）',
    size REAL COMMENT '模型大小（MB）',
    infer_time REAL COMMENT '推理耗时（ms）',
    accuracy REAL COMMENT '模型精度',
    env TEXT COMMENT '运行环境',
    desc TEXT COMMENT '模型描述',
    upload_time TEXT COMMENT '上传时间',
    status TEXT COMMENT '模型状态（部署/未部署/运行中）',
    load_time TEXT COMMENT '加载时间'
);

-- 4. 用户账号表 (对应 users.json)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COMMENT '用户名（唯一）',
    password TEXT NOT NULL COMMENT '密码（建议存储哈希值）',
    role TEXT DEFAULT 'user' COMMENT '用户角色（admin管理员/user普通用户/guest访客）',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '账号创建时间'
);

-- 5. 用户个人信息表 (扩展用户信息)
CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COMMENT '关联用户名（外键）',
    nickname TEXT COMMENT '用户昵称',
    avatar TEXT COMMENT '头像URL',
    phone TEXT COMMENT '联系电话',
    email TEXT COMMENT '联系邮箱',
    address TEXT COMMENT '联系地址',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '信息更新时间',
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 6. 用户登录日志表 (对应 login_log.json)
CREATE TABLE IF NOT EXISTS user_login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL COMMENT '关联用户名（外键）',
    time TEXT NOT NULL COMMENT '登录时间',
    ip TEXT COMMENT '登录IP',
    location TEXT COMMENT '登录位置',
    type TEXT COMMENT '登录类型（正常登录/异常登录）',
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '日志记录时间',
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);