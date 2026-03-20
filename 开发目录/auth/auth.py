from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash

# ===== 以下是新增导入 =====
import json
import os

auth = Blueprint('auth', __name__)

# ===== 以下是新增配置 =====
# 用户数据保存到 父级目录的 users.json
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 开发目录
JSON_DIR = os.path.join(BASE_DIR, 'log')
USER_FILE = os.path.join(JSON_DIR, "user.json")


# ===== 以下是新增工具函数 =====
# 读取用户列表
def load_users():
    if not os.path.exists(USER_FILE):
        return []
    with open(USER_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except:
            return []


# 保存新用户
def save_user(username, password):
    users = load_users()
    for u in users:
        if u['username'] == username:
            return False
    users.append({
        "username": username,
        "password": generate_password_hash(password)
    })
    with open(USER_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
    return True


# ===== 原有登录路由（已完善） =====
@auth.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        users = load_users()

        for u in users:
            if u['username'] == username:
                if check_password_hash(u['password'], password):
                    session['user'] = username
                    return redirect('/index')
                else:
                    error = "密码错误"
                    break
        else:
            error = "用户不存在"
    return render_template('login.html', error=error)


# ===== 以下是 新增AJAX注册接口 =====
@auth.route('/register-ajax', methods=['POST'])
def register_ajax():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'code': 400, 'msg': '用户名和密码不能为空'})

    if save_user(username, password):
        return jsonify({'code': 200, 'msg': '注册成功'})
    else:
        return jsonify({'code': 400, 'msg': '用户名已存在'})


# 跳转路由
@auth.route('/register')
def register():
    return redirect(url_for('auth.login'))