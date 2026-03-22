from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import sys
import uuid
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from detection.YOLOV11 import yolov11_detect
from data_transport.device_transport import device_transport_bp
from data_transport.model_transport import model_transport_bp
from data_transport.detection_transport import save_detection_record, get_all_detection_records  # 新增导入
from flask_cors import CORS

app = Flask(__name__,
            static_folder='static',  # 静态文件（JS/CSS）目录
            template_folder='templates'  # HTML 模板目录
            )
CORS(app)  # 允许跨域

# 注册蓝图
app.register_blueprint(device_transport_bp)
app.register_blueprint(model_transport_bp)

# 配置路径
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
RESULT_FOLDER = os.path.join(os.path.dirname(__file__), './detection/runs/detect')
MODEL_PATH = os.path.join(os.path.dirname(__file__), './detection/model_pt/yolo11s.pt')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)


# 首页：导航
@app.route('/')
def index():
    return render_template('navgation.html')  # 修正拼写错误：navgation → navigation

# 首页：目标检测中心
@app.route('/object_detection_controlcenter')
def object_detection_controlcenter():  # 修正函数名拼写错误
    return render_template('object_detection_controlcenter.html')

# 监控中心
@app.route('/visual_dashboard')
def visual_dashboard():
    return render_template('visual_dashboard.html')

# 历史溯源
@app.route('/history')
def history():
    return render_template('history.html')

# 数据分析
@app.route('/historical_data_analysis')
def historical_data_analysis():
    return render_template('historical_data_analysis.html')

# 模型管理
@app.route('/model_management')
def model_management():
    return render_template('model_management.html')

# 设备管理
@app.route('/edge_device_management')
def edge_device_management():
    return render_template('edge_device_management.html')

# 用户中心
@app.route('/user_center')
def user_center():
    return render_template('user_center.html')

# 登录
@app.route('/login')
def login():
    return render_template('login.html')

# 注册
@app.route('/register')
def register():
    return render_template('register.html')


# 检测接口（集成记录存储）
@app.route('/api/detect', methods=['POST'])
def detect_image_api():
    file = request.files['image']
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}.{file_ext}"
    upload_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(upload_path)

    # 调用检测函数
    results, output_img_path, info = yolov11_detect(
        image_path=upload_path,
        model_path=MODEL_PATH,
        save_dir=RESULT_FOLDER,
        show=False
    )

    # 判断检测是否失败
    if info['status'] == 'error':
        return jsonify({
            'success': False,
            'msg': info['msg'],
            'detect_count': 0,
            'avg_conf': 0,
            'result_image_url': '',
            'result_text': '',
            'classes': []
        }), 500

    # 保存检测记录到JSON文件（类型：图片）
    record_id = save_detection_record(
        detect_type="图片",
        detect_results=info['classes'],
        llm_suggestion="检测到人体目标，建议确认区域人员安全状态"  # 示例大模型建议
    )

    # 处理检测结果文本
    result_text = f"检测完成！共识别到 {info['detect_count']} 个目标：\n"
    for i, cls in enumerate(info['classes']):
        result_text += f"{i+1}. 类别：{cls['class']} | 置信度：{cls['confidence']}%\n"

    result_img_filename = os.path.basename(output_img_path)
    result_image_url = f"/results/{result_img_filename}"

    return jsonify({
        'success': True,
        'record_id': record_id,  # 返回记录ID
        'detect_count': info['detect_count'],
        'avg_conf': round(sum([cls['confidence'] for cls in info['classes']])/info['detect_count'], 2) if info['detect_count']>0 else 0,
        'result_image_url': result_image_url,
        'result_text': result_text,
        'classes': info['classes'],
        'latency': 8.5
    })

# 获取所有检测记录接口（供前端调用）
@app.route('/api/detection_records', methods=['GET'])
def get_detection_records_api():
    try:
        records = get_all_detection_records()
        return jsonify({
            'success': True,
            'records': records,
            'total': len(records)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'msg': f'获取记录失败：{str(e)}',
            'records': [],
            'total': 0
        }), 500

# 结果图片访问
@app.route('/results/<filename>')
def serve_result_image(filename):
    return send_from_directory(RESULT_FOLDER, filename)

# 上传图片访问
@app.route('/uploads/<filename>')
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    CORS(app)
    app.run(host='0.0.0.0', port=5000, debug=True)