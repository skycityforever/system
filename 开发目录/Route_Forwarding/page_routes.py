from flask import render_template, session, redirect, url_for
from 开发目录.Route_Forwarding import main_bp
from 开发目录.app import login_required  # 从主app导入装饰器

# ==========================
# 页面路由（全部迁移到这里）
# ==========================
@main_bp.route('/')
def index():
    if 'username' in session:
        return redirect(url_for('main.navgation'))
    return render_template('login.html')

@main_bp.route('/navgation')
@login_required
def navgation():
    return render_template('navgation.html')

@main_bp.route('/object_detection_controlcenter')
@login_required
def object_detection_controlcenter():
    return render_template('object_detection_controlcenter.html')

@main_bp.route('/visual_dashboard')
@login_required
def visual_dashboard():
    return render_template('visual_dashboard.html')

@main_bp.route('/history')
@login_required
def history():
    return render_template('history.html')

@main_bp.route('/historical_data_analysis')
@login_required
def historical_data_analysis():
    return render_template('historical_data_analysis.html')

@main_bp.route('/model_management')
@login_required
def model_management():
    return render_template('model_management.html')

@main_bp.route('/edge_device_management')
@login_required
def edge_device_management():
    return render_template('edge_device_management.html')

@main_bp.route('/user_center')
@login_required
def user_center():
    return render_template('user_center.html')

@main_bp.route('/register')
def register():
    if 'username' in session:
        return redirect(url_for('main.navgation'))
    return render_template('register.html')

@main_bp.route('/data_collection')
@login_required
def data_collection():
    return render_template('data_collection.html')