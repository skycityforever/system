from datetime import datetime, timedelta
import random
from flask import Flask, request, jsonify, send_from_directory, render_template, session, redirect, url_for
import os
import sys
import uuid
from datetime import datetime
import glob
import cv2
import numpy as np
import onnxruntime
import psutil
import json
import string  # 新增：用于生成验证码字符

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from detection.YOLOV11 import yolov11_detect
from detection.yolo11_pos.yolov11_pose_detect import yolov11_pose_detect
from detection.rt_detr.rtdetr_detect import rtdetr_detect
from detection.Person_Age_Detection.gad import AgeGenderDetector

from data_transport.device_transport import device_transport_bp
from data_transport.model_transport import model_transport_bp
from data_transport.detection_transport import (
    save_detection_record,
    get_all_detection_records,
    update_detection_record_llm
)
from data_transport.visual_dashboard_api import dashboard_bp
from data_transport.data_collection_transport import (
    save_collection_data,
    get_all_collection_data,
    get_collection_data_by_scene
)
from flask_cors import CORS
from llm_integration.llm_client import DoubaoEnvironmentAnalyzer

# ==========================
# 数据库自动集成（已内置）
# ==========================
try:
    from database_controller.database_controller import (
        get_db_connection,
        insert_detection_record,
        import_detection_records,
        import_devices,
        import_models,
        import_users,
        import_login_logs
    )
    DB_ENABLED = True
    print("✅ 数据库模块加载成功 → 自动同步 JSON → SQLite")
except Exception as e:
    DB_ENABLED = False
    print(f"⚠️ 数据库未启用：{str(e)}")

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

# ==========================
# 核心安全配置（新增）
# ==========================
# 1. 设置Session密钥（必须，建议生产环境用随机生成的密钥）
app.secret_key = os.urandom(24)  # 随机生成24位密钥
# 2. 设置Session有效期（2天）
app.permanent_session_lifetime = timedelta(days=2)
# 3. 配置CORS允许携带Cookie
CORS(app, supports_credentials=True)
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
RTDETR_MODEL_PATH = os.path.join(os.path.dirname(__file__), './detection/model_pt/rtdetr-l.pt')
YOLOV11_POSE_MODEL_PATH = os.path.join(os.path.dirname(__file__), './detection/model_pt/yolo11s-pose.pt')


os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

llm_analyzer = DoubaoEnvironmentAnalyzer(
    api_url="https://metaso.cn/api/v1/chat/completions",
    api_key="mk-7925AE7CBDE52565CD3535FECAAC9172"
)

# ==========================
# 登录验证装饰器（核心安全功能，新增）
# ==========================
def login_required(f):
    """登录验证装饰器：未登录用户重定向到登录页"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 检查Session中是否有登录标识
        if 'username' not in session:
            # 验证码接口无需登录
            if request.path.startswith('/api/') and not request.path.startswith(
                    '/api/verify-login') and not request.path.startswith(
                    '/api/register') and not request.path.startswith('/api/generate-code'):
                return jsonify({"success": False, "msg": "请先登录！", "need_login": True}), 401
            else:
                return redirect(url_for('index'))
        return f(*args, **kwargs)

    return decorated_function


# ==========================
# 验证码生成接口（新增核心）
# ==========================
@app.route('/api/generate-code', methods=['GET'])
def generate_code():
    """生成4位验证码并存储到Session（供前端验证）"""
    try:
        # 生成4位大小写字母+数字的验证码
        char_set = string.ascii_uppercase + string.digits  # 只保留大写+数字，降低复杂度
        code = ''.join(random.choices(char_set, k=4))
        session['verify_code'] = code  # 存储到Session，用于后续验证
        return jsonify({
            'success': True,
            'code': code  # 前端可基于此生成验证码图片（也可后端返回Base64图片）
        })
    except Exception as e:
        print(f"生成验证码失败：{e}")
        return jsonify({'success': False, 'msg': '生成验证码失败'})


# ==========================
# 登录/登出接口（整合验证码验证）
# ==========================
# 登录验证接口（唯一版本，整合验证码逻辑）
@app.route('/api/verify-login', methods=['POST'])
def verify_login():
    try:
        # 获取前端提交的所有参数
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        verify_code = data.get('verifyCode')  # 新增：接收前端传入的验证码

        # 1. 先验证验证码（必填）
        if not verify_code:
            return jsonify({'success': False, 'msg': '请输入验证码'})

        # 从Session获取生成的验证码，对比（不区分大小写）
        session_code = session.get('verify_code')
        if not session_code or verify_code.upper() != session_code.upper():
            return jsonify({'success': False, 'msg': '验证码错误'})

        # 2. 验证账号密码
        log_dir = os.path.join(os.path.dirname(__file__), 'log')
        os.makedirs(log_dir, exist_ok=True)  # 自动创建log文件夹
        users_path = os.path.join(log_dir, 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        # 遍历验证账号密码
        for user in users:
            if user.get('username') == username and user.get('password') == password:
                # 登录成功：设置Session
                session.permanent = True  # 启用永久Session（2天有效期）
                session['username'] = username  # 存储用户名到Session
                session['login_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                session.pop('verify_code', None)  # 验证码使用后销毁，防止重复使用

                # ========== 新增：写入登录日志 ==========
                log_dir = os.path.join(os.path.dirname(__file__), 'log')
                os.makedirs(log_dir, exist_ok=True)
                login_log_path = os.path.join(log_dir, 'login_log.json')

                # 构造日志数据
                login_log = {
                    "username": username,
                    "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "ip": request.remote_addr,  # 获取客户端IP
                    "location": "未知位置",  # 简单版：固定值，进阶版可对接IP解析接口
                    "type": "正常登录"
                }

                # 读取原有日志，追加新日志
                if os.path.exists(login_log_path):
                    with open(login_log_path, 'r', encoding='utf-8') as f:
                        try:
                            logs = json.load(f)
                        except json.JSONDecodeError:
                            logs = []
                else:
                    logs = []

                logs.append(login_log)
                # 只保留最近10条日志（可选，避免文件过大）
                logs = logs[-10:]

                # 写入文件
                with open(login_log_path, 'w', encoding='utf-8') as f:
                    json.dump(logs, f, ensure_ascii=False, indent=4)

                return jsonify({'success': True, 'msg': '登录成功'})

        # 账号密码不匹配
        return jsonify({'success': False, 'msg': '账号或密码错误'})

    except Exception as e:
        print(f'登录验证失败：{e}')
        return jsonify({'success': False, 'msg': '登录失败，请重试'})



# 登出接口（新增）
@app.route('/api/logout', methods=['POST'])
def logout():
    # 清除所有Session（包括登录状态和验证码）
    session.clear()
    return jsonify({'success': True, 'msg': '登出成功'})


# ==========================
# 注册接口（保留）
# ==========================
@app.route('/api/register', methods=['POST'])
def user_register():
    try:
        # 获取前端提交的注册数据
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        inviteCode = data.get('inviteCode')

        # 校验必填字段
        if not username or not password or not inviteCode:
            return jsonify({'code': 400, 'msg': '账号、密码、邀请码不能为空'})

        # ====================== 邀请码验证（新增）======================
        INVITE_CODE_CORRECT = "POLAR_GUARD_SUCESS"
        invite_status = False  # 默认无权限

        if inviteCode is not None and inviteCode.strip() != "":
            # 有输入邀请码 → 校验
            if inviteCode.strip() != INVITE_CODE_CORRECT:
                return jsonify({'code': 400, 'msg': '邀请码输入错误'})
            else:
                invite_status = True
        # ==============================================================

        # 定义users.json路径（确保log文件夹存在）
        log_dir = os.path.join(os.path.dirname(__file__), 'log')
        os.makedirs(log_dir, exist_ok=True)  # 自动创建log文件夹
        users_path = os.path.join(log_dir, 'users.json')

        # 读取现有用户数据（如果文件不存在则初始化空列表）
        if os.path.exists(users_path):
            with open(users_path, 'r', encoding='utf-8') as f:
                try:
                    users = json.load(f)
                except json.JSONDecodeError:  # 文件为空或格式错误时初始化
                    users = []
        else:
            users = []

        # 检查账号是否已存在
        for user in users:
            if user.get('username') == username:
                return jsonify({'code': 409, 'msg': '该账号已被注册'})

        # 构造新用户数据（补充预留字段）
        new_user = {
            "username": username,
            "password": password,
            "inviteCode": invite_status,  # 存入 true/false
            "phone": "",
            "name": "",
            "jobNo": "",
            "notifyEmail": "",
            "create_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "nickname": "未命名",
            "realName": "未命名",
            "userId": "未分配",
            "jobNumber": "未分配",
            "role": "普通用户",
            "auth": "基础权限",
            "bioVerify": "未录入",
            "avatar": "https://modao.cc/agent-py/media/generated_images/2026-03-18/3fc0139ebe274f268819b87bcbb7263f.jpg",
            "score": "0.0"
        }

        # 写入新用户到JSON文件
        users.append(new_user)
        with open(users_path, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=4)  # indent=4 格式化显示

        # 如果启用了数据库，同步到SQLite
        if DB_ENABLED:
            try:
                import_users()  # 调用已有的导入函数同步到数据库
                print(f"🟢 [DB] 新用户 {username} 已同步到数据库")
            except Exception as e:
                print(f"🔴 [DB] 用户同步失败：{e}")

        # 返回成功响应
        return jsonify({'code': 200, 'msg': '注册成功'})

    except Exception as e:
        print(f'注册失败：{e}')
        return jsonify({'code': 500, 'msg': f'服务器错误：{str(e)}'})
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
# 【修复】直接使用gad.py的AgeGenderDetector，不再重复定义
# ==========================
# 初始化年龄检测模型
age_gender_detector = AgeGenderDetector()

# ==========================
# 页面路由（添加登录验证装饰器）
# ==========================
@app.route('/')
def index():
    # 如果已登录，直接跳转到导航页
    if 'username' in session:
        return redirect(url_for('navgation'))
    return render_template('login.html')

@app.route('/navgation')
@login_required  # 需登录才能访问
def navgation():
    return render_template('navgation.html')

@app.route('/object_detection_controlcenter')
@login_required  # 需登录才能访问
def object_detection_controlcenter():
    return render_template('object_detection_controlcenter.html')


@app.route('/visual_dashboard')
@login_required  # 需登录才能访问
def visual_dashboard():
    return render_template('visual_dashboard.html')


@app.route('/history')
@login_required  # 需登录才能访问
def history():
    return render_template('history.html')


@app.route('/historical_data_analysis')
@login_required  # 需登录才能访问
def historical_data_analysis():
    return render_template('historical_data_analysis.html')


@app.route('/model_management')
@login_required  # 需登录才能访问
def model_management():
    return render_template('model_management.html')


@app.route('/edge_device_management')
@login_required  # 需登录才能访问
def edge_device_management():
    return render_template('edge_device_management.html')


@app.route('/user_center')
@login_required  # 需登录才能访问
def user_center():
    return render_template('user_center.html')

@app.route('/register')
def register():
    # 注册页无需登录，但已登录用户跳转到导航页
    if 'username' in session:
        return redirect(url_for('navgation'))
    return render_template('register.html')

# 数据采集页面
@app.route('/data_collection')
@login_required  # 需登录才能访问
def data_collection():
    return render_template('data_collection.html')

# ==========================
# 获取当前登录用户信息接口（新增）
# ==========================
@app.route('/api/current-user', methods=['GET'])
@login_required
def get_current_user():
    try:
        username = session.get('username')
        if not username:
            return jsonify({"success": False, "msg": "未获取到登录信息"}), 401

        log_dir = os.path.join(os.path.dirname(__file__), 'log')
        os.makedirs(log_dir, exist_ok=True)  # 自动创建log文件夹
        users_path = os.path.join(log_dir, 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        current_user = None
        for user in users:
            if user.get('username') == username:
                current_user = user
                break

        if not current_user:
            return jsonify({"success": False, "msg": "用户信息不存在"}), 404

        # ====================== 根据 inviteCode 判断角色 ======================
        invite_status = current_user.get('inviteCode', False)
        role_name = "管理员" if invite_status is True else "普通用户"
        auth_name = "核心权限" if invite_status is True else "基础权限"
        # ====================================================================

        user_info = {
            "username": current_user.get('username', '未命名'),
            "nickname": current_user.get('nickname', '未命名'),
            "realName": current_user.get('realName', '未命名'),
            "userId": current_user.get('userId', '未分配'),
            "jobNumber": current_user.get('jobNumber', '未分配'),
            "role": role_name,  # 动态判断
            "auth": auth_name,
            "phone": current_user.get('phone', '未绑定'),
            "email": current_user.get('notifyEmail') or current_user.get('email', '未绑定'),
            "bioVerify": current_user.get('bioVerify', '未录入'),
            "avatar": current_user.get('avatar', 'https://modao.cc/agent-py/media/generated_images/2026-03-18/3fc0139ebe274f268819b87bcbb7263f.jpg'),
            "score": current_user.get('score', '0.0')
        }
        return jsonify({"success": True, "data": user_info})
    except Exception as e:
        print(f"获取用户信息失败：{e}")
        return jsonify({"success": False, "msg": f"获取用户信息失败：{str(e)}"}), 500

# ==========================
# 读取登录日志接口（新增）
# ==========================
@app.route('/api/login-logs', methods=['GET'])
@login_required
def get_login_logs():
    """获取当前用户的登录日志"""
    try:
        username = session.get('username')
        if not username:
            return jsonify({"success": False, "msg": "未登录"}), 401

        # 读取登录日志文件
        login_log_path = os.path.join(os.path.dirname(__file__), 'log', 'login_log.json')
        if os.path.exists(login_log_path):
            with open(login_log_path, 'r', encoding='utf-8') as f:
                try:
                    all_logs = json.load(f)
                except json.JSONDecodeError:
                    all_logs = []
        else:
            all_logs = []

        # 筛选当前用户的日志
        user_logs = [log for log in all_logs if log.get('username') == username]
        # 按时间倒序排列
        user_logs.sort(key=lambda x: x['time'], reverse=True)

        return jsonify({"success": True, "data": user_logs})

    except Exception as e:
        print(f"读取登录日志失败：{e}")
        return jsonify({"success": False, "msg": str(e)}), 500

# ==========================
# 更新用户信息接口（新增工号+生物验证字段）
# ==========================
@app.route('/api/update-user', methods=['POST'])
@login_required
def update_user():
    try:
        username = session.get('username')
        if not username:
            return jsonify({"success": False, "msg": "未登录"}), 401

        # 获取前端传来的数据（新增jobNumber+bioVerify）
        data = request.get_json()
        realName = data.get('realName', '')
        phone = data.get('phone', '')
        email = data.get('email', '')
        nickname = data.get('nickname', '')
        jobNumber = data.get('jobNumber', '')  # 工号字段
        bioVerify = data.get('bioVerify', '')  # 生物验证字段

        # 读取JSON
        log_dir = os.path.join(os.path.dirname(__file__), 'log')
        os.makedirs(log_dir, exist_ok=True)
        users_path = os.path.join(log_dir, 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        # 找到当前用户并更新（新增jobNumber+bioVerify）
        updated = False
        for user in users:
            if user.get('username') == username:
                user['realName'] = realName
                user['phone'] = phone
                user['email'] = email
                user['nickname'] = nickname
                user['jobNumber'] = jobNumber
                if bioVerify:  # 只有前端传了才更新，避免覆盖
                    user['bioVerify'] = bioVerify
                updated = True
                break

        if not updated:
            return jsonify({"success": False, "msg": "用户不存在"}), 404

        # 写回文件
        with open(users_path, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

        return jsonify({"success": True, "msg": "保存成功"})

    except Exception as e:
        print("保存错误:", e)
        return jsonify({"success": False, "msg": "保存失败：" + str(e)}), 500

# ==========================
# 修改密码接口（新增）
# ==========================
@app.route('/api/update-password', methods=['POST'])
@login_required
def update_password():
    try:
        username = session.get('username')
        if not username:
            return jsonify({"success": False, "msg": "未登录"}), 401

        data = request.get_json()
        old_pwd = data.get('oldPassword')
        new_pwd = data.get('newPassword')
        confirm_pwd = data.get('confirmPassword')

        # 前端校验
        if not old_pwd or not new_pwd or not confirm_pwd:
            return jsonify({"success": False, "msg": "请填写完整"})
        if new_pwd != confirm_pwd:
            return jsonify({"success": False, "msg": "两次密码不一致"})
        if len(new_pwd) < 6:
            return jsonify({"success": False, "msg": "密码长度至少6位"})

        # 读取用户文件
        users_path = os.path.join('log', 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        # 找到用户并校验旧密码
        user_found = None
        for user in users:
            if user.get('username') == username:
                user_found = user
                break

        if not user_found:
            return jsonify({"success": False, "msg": "用户不存在"})
        if user_found.get('password') != old_pwd:
            return jsonify({"success": False, "msg": "原密码错误"})

        # 更新密码
        user_found['password'] = new_pwd

        # 写回文件
        with open(users_path, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

        # 同步数据库（如果开启）
        if DB_ENABLED:
            try:
                import_users()
            except:
                pass

        return jsonify({"success": True, "msg": "密码修改成功，请重新登录"})

    except Exception as e:
        print("修改密码错误:", e)
        return jsonify({"success": False, "msg": "修改失败：" + str(e)}), 500
# ==========================
# 生物验证录入/更新接口（新增）
# ==========================
@app.route('/api/update-bio-verify', methods=['POST'])
@login_required
def update_bio_verify():
    try:
        username = session.get('username')
        if not username:
            return jsonify({"success": False, "msg": "未登录"}), 401

        # 获取前端传来的生物验证状态
        data = request.get_json()
        bioVerify = data.get('bioVerify', '未录入')  # 可选值：未录入/已录入/已绑定

        # 读取JSON
        log_dir = os.path.join(os.path.dirname(__file__), 'log')
        os.makedirs(log_dir, exist_ok=True)
        users_path = os.path.join(log_dir, 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        # 找到当前用户并更新生物验证状态
        updated = False
        for user in users:
            if user.get('username') == username:
                user['bioVerify'] = bioVerify
                updated = True
                break

        if not updated:
            return jsonify({"success": False, "msg": "用户不存在"}), 404

        # 写回文件
        with open(users_path, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

        # 同步数据库（如果开启）
        if DB_ENABLED:
            try:
                import_users()
            except:
                pass

        return jsonify({"success": True, "msg": "生物验证状态更新成功", "bioVerify": bioVerify})

    except Exception as e:
        print("生物验证更新错误:", e)
        return jsonify({"success": False, "msg": "更新失败：" + str(e)}), 500
# ==========================
# 模型切换接口（新增age_recognition映射）
# ==========================
@app.route('/api/set_current_model', methods=['POST'])
@login_required
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
@login_required
def get_current_model():
    return jsonify({
        "success": True,
        "current_model": current_deployed_model
    })

# ==========================
# ✅ 实时设备状态接口（GPU + 内存）
# ==========================
@app.route('/api/device_status', methods=['GET'])
@login_required
def device_status():
    try:
        gpu_used = 0
        gpu_total = 24
        if gpu_available:
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
            gpu_used = round(mem.used / 1024**3, 1)
            gpu_total = round(mem.total / 1024**3, 1)

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
# 统一检测接口 + 自动同步数据库（新增年龄检测分支）
# ==========================
@app.route('/api/detect', methods=['POST'])
@login_required
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

            record_id = save_detection_record(
                detect_type="图片检测",
                detect_results=info['classes']
            )

            # 同步 SQLite
            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "图片检测",
                        "detect_results": json.dumps(info['classes']),
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                    print(f"🟢 [DB] 检测记录已保存：{record_id}")
                except Exception as e:
                    print(f"🔴 [DB] 保存失败：{e}")

            return jsonify({
                "success": True,
                "detect_count": info['detect_count'],
                "avg_conf": round(sum([c['confidence'] for c in info['classes']])/info['detect_count'],2) if info['detect_count']>0 else 0,
                "result_image_url": result_image_url,
                "result_text": result_text,
                "classes": info['classes'],
                "latency": 12,
                "saved_filename": unique_filename,
                "record_id": record_id
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
            record_id = save_detection_record(detect_type="图像去雾", detect_results=[])

            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "图像去雾",
                        "detect_results": "[]",
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                    print(f"🟢 [DB] 去雾记录已保存：{record_id}")
                except:
                    pass

            return jsonify({
                "success": True,
                "detect_count": 0,
                "avg_conf": 0,
                "result_image_url": result_image_url,
                "result_text": "C2PNet 去雾完成\n图像清晰度已提升",
                "classes": [],
                "latency": 18,
                "saved_filename": unique_filename,
                "record_id": record_id
            })

        elif model == "rt_detr":
            results, output_img_path, info = rtdetr_detect(
                image_path=upload_path,
                model_path=RTDETR_MODEL_PATH,
                save_dir=RESULT_FOLDER,
                show=False
            )
            if info['status'] == 'error':
                return jsonify({'success': False, 'msg': info['msg']}), 500

            result_text = f"RT-DETR 检测完成：{info['detect_count']} 个目标\n"
            for cls in info['classes']:
                result_text += f"{cls['class']} {cls['confidence']}%\n"

            result_image_url = f"/results/{os.path.basename(output_img_path)}"
            record_id = save_detection_record(detect_type="RT-DETR检测", detect_results=info['classes'])

            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "RT-DETR检测",
                        "detect_results": json.dumps(info['classes']),
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                    print(f"🟢 [DB] RT-DETR 记录已保存：{record_id}")
                except:
                    pass

            return jsonify({
                "success": True,
                "detect_count": info['detect_count'],
                "avg_conf": round(sum([c['confidence'] for c in info['classes']])/info['detect_count'],2) if info['detect_count']>0 else 0,
                "result_image_url": result_image_url,
                "result_text": result_text,
                "classes": info['classes'],
                "latency": 15,
                "saved_filename": unique_filename,
                "record_id": record_id
            })
        elif model == "yolov11_pose":
            results, output_img_path, info = yolov11_pose_detect(
                image_path=upload_path,
                model_path=YOLOV11_POSE_MODEL_PATH,
                save_dir=RESULT_FOLDER,
                show=False
            )
            if info['status'] == 'error':
                return jsonify({'success': False, 'msg': info['msg']}), 500

            result_text = f"姿态估计完成：{info['detect_count']} 个人体\n"
            for cls in info['classes']:
                result_text += f"{cls['class']} {cls['confidence']}% | 姿态: {cls['pose_label']}\n"

            result_img_filename = os.path.basename(output_img_path)
            result_image_url = f"/results/{result_img_filename}"

            record_id = save_detection_record(
                detect_type="姿态估计",
                detect_results=info['classes']
            )

            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "姿态估计",
                        "detect_results": json.dumps(info['classes']),
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                except:
                    pass

            return jsonify({
                "success": True,
                "detect_count": info['detect_count'],
                "avg_conf": round(sum([c['confidence'] for c in info['classes']]) / info['detect_count'], 2) if info[
                                                                                                                    'detect_count'] > 0 else 0,
                "result_image_url": result_image_url,
                "result_text": result_text,
                "classes": info['classes'],
                "latency": 14,
                "saved_filename": unique_filename,
                "record_id": record_id
            })
        # 年龄/性别检测分支（直接使用gad.py的类）
        elif model == "age":
            info = age_gender_detector.detect(
                image_path=upload_path,
                save_dir=RESULT_FOLDER
            )
            if info['status'] == 'error':
                return jsonify({'success': False, 'msg': info['msg']}), 500

            result_text = f"年龄/性别检测完成：{info['detect_count']} 个人脸\n"
            for cls in info['classes']:
                result_text += f"{cls['class']} {cls['confidence']}%\n"

            result_image_url = f"/results/{os.path.basename(info['output_img_path'])}"
            record_id = save_detection_record(detect_type="年龄/性别检测", detect_results=info['classes'])

            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "年龄/性别检测",
                        "detect_results": json.dumps(info['classes']),
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                    print(f"🟢 [DB] 年龄检测记录已保存：{record_id}")
                except Exception as e:
                    print(f"🔴 [DB] 保存失败：{e}")

            return jsonify({
                "success": True,
                "detect_count": info['detect_count'],
                "avg_conf": round(sum([c['confidence'] for c in info['classes']])/info['detect_count'],2) if info['detect_count']>0 else 0,
                "result_image_url": result_image_url,
                "result_text": result_text,
                "classes": info['classes'],
                "latency": 10,
                "saved_filename": unique_filename,
                "record_id": record_id
            })
        else:
            return jsonify({"success": False, "msg": "该模型暂未实现"}), 400

    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500

# ==========================
# 环境分析
# ==========================
@app.route('/api/analyze_environment', methods=['POST'])
@login_required
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
@login_required
def get_detection_records_api():
    try:
        records = get_all_detection_records()
        return jsonify({"success": True, "records": records, "total": len(records)})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}),500

# ==========================
# ✅ 前端修改 JSON → 自动全量同步到数据库
# ==========================
@app.route('/api/sync_json_to_db', methods=['POST'])
@login_required
def sync_json_to_db():
    if not DB_ENABLED:
        return jsonify({"success": False, "msg": "数据库未连接"})
    try:
        print("\n=====================================")
        print("🔄 前端触发同步：JSON → 正在写入 SQLite...")
        import_detection_records()
        import_devices()
        import_models()
        import_users()
        print("✅ 同步完成：所有 JSON 已导入数据库")
        print("=====================================\n")
        return jsonify({"success": True, "msg": "同步成功"})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)})

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

# ==========================
# 启动时自动同步一次
# ==========================
if DB_ENABLED:
    try:
        print("\n🚀 系统启动 → 自动同步 JSON → SQLite...")
        import_detection_records()
        import_devices()
        import_models()
        import_users()
        import_login_logs()
        print("✅ 数据库初始化完成\n")
    except Exception as e:
        print(f"⚠️ 同步失败：{e}\n")

# 数据采集提交接口
@app.route('/api/data_collection', methods=['POST'])
@login_required
def api_data_collection():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "msg": "无效数据"}), 400
        # 校验工厂场景工号必填
        if data.get("scene") == "factory" and not data.get("specific_info", {}).get("worker_id"):
            return jsonify({"success": False, "msg": "工厂场景工号为必填项"}), 400
        # 保存数据
        save_collection_data(data)
        return jsonify({"success": True, "msg": "数据采集成功"})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500

# 数据采集记录查询接口（供前端展示）
@app.route('/api/data_collection/records')
@login_required
def api_data_collection_records():
    scene = request.args.get("scene", "")
    if scene:
        data = get_collection_data_by_scene(scene)
    else:
        data = get_all_collection_data()
    return jsonify({"success": True, "records": data})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)