from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import sys
import uuid
from datetime import datetime
import glob

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from detection.YOLOV11 import yolov11_detect
from data_transport.device_transport import device_transport_bp
from data_transport.model_transport import model_transport_bp
from data_transport.detection_transport import (
    save_detection_record,
    get_all_detection_records,
    update_detection_record_llm
)
from data_transport.visual_dashboard_api import dashboard_bp
from flask_cors import CORS
from llm_integration.llm_client import DoubaoEnvironmentAnalyzer

app = Flask(__name__,
            static_folder='static',
            template_folder='templates'
            )
CORS(app)

# 注册蓝图
app.register_blueprint(device_transport_bp)
app.register_blueprint(model_transport_bp)
app.register_blueprint(dashboard_bp)
# 配置路径
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
RESULT_FOLDER = os.path.join(os.path.dirname(__file__), './detection/runs/detect')
MODEL_PATH = os.path.join(os.path.dirname(__file__), './detection/model_pt/yolo11s.pt')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# 初始化大模型分析器
llm_analyzer = DoubaoEnvironmentAnalyzer(
    api_url="https://metaso.cn/api/v1/chat/completions",
    api_key="mk-7925AE7CBDE52565CD3535FECAAC9172"
)


# 路由定义
@app.route('/')
def index():
    return render_template('navgation.html')


@app.route('/object_detection_controlcenter')
def object_detection_controlcenter():
    return render_template('object_detection_controlcenter.html')


@app.route('/visual_dashboard')
def visual_dashboard():
    return render_template('visual_dashboard.html')


@app.route('/history')
def history():
    return render_template('history.html')


@app.route('/historical_data_analysis')
def historical_data_analysis():
    return render_template('historical_data_analysis.html')


@app.route('/model_management')
def model_management():
    return render_template('model_management.html')


@app.route('/edge_device_management')
def edge_device_management():
    return render_template('edge_device_management.html')


@app.route('/user_center')
def user_center():
    return render_template('user_center.html')


@app.route('/login')
def login():
    return render_template('login.html')


@app.route('/register')
def register():
    return render_template('register.html')


# 检测接口（修复路径+返回完整文件名）
@app.route('/api/detect', methods=['POST'])
def detect_image_api():
    try:
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

        if info['status'] == 'error':
            return jsonify({
                'success': False,
                'msg': info['msg'],
                'detect_count': 0,
                'avg_conf': 0,
                'result_image_url': '',
                'result_text': '',
                'classes': [],
                'saved_filename': ''  # 新增：返回空文件名
            }), 500

        # 生成环境描述（用于大模型兜底）
        env_desc = ""
        if info['detect_count'] > 0:
            env_desc += f"图片中有{info['detect_count']}个人体目标；"
        if "雾" in file.name or "雾" in upload_path:
            env_desc += "大雾天气，能见度低；"
        elif "雨" in file.name:
            env_desc += "暴雨天气；"
        elif "雪" in file.name:
            env_desc += "大雪天气；"

        # 保存检测记录（初始建议）
        record_id = save_detection_record(
            detect_type="图片",
            detect_results=info['classes'],
            llm_suggestion="检测到人体目标，建议确认区域人员安全状态"
        )

        # 处理结果文本
        result_text = f"检测完成！共识别到 {info['detect_count']} 个目标：\n"
        for i, cls in enumerate(info['classes']):
            result_text += f"{i + 1}. 类别：{cls['class']} | 置信度：{cls['confidence']}%\n"

        result_img_filename = os.path.basename(output_img_path)
        result_image_url = f"/results/{result_img_filename}"

        return jsonify({
            'success': True,
            'record_id': record_id,  # 返回记录ID给前端
            'detect_count': info['detect_count'],
            'avg_conf': round(sum([cls['confidence'] for cls in info['classes']]) / info['detect_count'], 2) if info[
                                                                                                                    'detect_count'] > 0 else 0,
            'result_image_url': result_image_url,
            'result_text': result_text,
            'classes': info['classes'],
            'latency': 8.5,
            'saved_filename': unique_filename,  # 新增：返回保存的完整文件名
            'env_desc': env_desc  # 新增：返回环境描述
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'msg': f"检测异常：{str(e)}",
            'detect_count': 0,
            'avg_conf': 0,
            'result_image_url': '',
            'result_text': '',
            'classes': [],
            'saved_filename': ''
        }), 500


# 环境分析接口（修复路径问题+更新LLM建议）
@app.route('/api/analyze_environment', methods=['POST'])
def analyze_environment():
    try:
        data = request.json
        # 获取前端传入的文件名，并拼接完整路径
        short_filename = data.get('image_path', '')
        full_image_path = os.path.join(UPLOAD_FOLDER, short_filename)
        # 获取环境描述
        image_desc = data.get('env_desc', '') or data.get('detect_result', '')
        # 获取记录ID
        record_id = data.get('record_id', '')

        # 调用大模型分析
        result = llm_analyzer.analyze_image(
            image_path=full_image_path,
            image_desc=image_desc
        )

        # 如果有记录ID，更新大模型建议到JSON文件
        if record_id:
            llm_suggestion_text = (
                f"环境类型：{result['environment_type']} | "
                f"防护建议：{'; '.join(result['protection_suggestions'])}"
            )
            update_detection_record_llm(record_id, llm_suggestion_text)

        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        print(f"大模型调用失败：{str(e)}，使用本地兜底结果")
        # 使用兜底结果
        result = llm_analyzer.get_local_fallback_result(
            image_desc=data.get('env_desc', '') or data.get('detect_result', '')
        )
        # 如果有记录ID，也更新兜底建议
        record_id = data.get('record_id', '')
        if record_id:
            llm_suggestion_text = (
                f"环境类型：{result['environment_type']} | "
                f"防护建议：{'; '.join(result['protection_suggestions'])}"
            )
            update_detection_record_llm(record_id, llm_suggestion_text)
        return jsonify({
            'success': True,
            'data': result
        })


# 获取检测记录接口
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


# 修复结果图片访问（支持多predict目录）
@app.route('/results/<filename>')
def serve_result_image(filename):
    try:
        # 查找最新的predict目录
        result_dirs = glob.glob(os.path.join(RESULT_FOLDER, 'predict*'))
        if result_dirs:
            latest_result_dir = max(result_dirs, key=os.path.getctime)
            return send_from_directory(latest_result_dir, filename)
        # 回退到主目录
        return send_from_directory(RESULT_FOLDER, filename)
    except Exception:
        # 返回默认图片
        return send_from_directory('static', 'default.png')


# 上传图片访问
@app.route('/uploads/<filename>')
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)