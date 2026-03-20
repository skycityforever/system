from flask import Flask
import os
import sys

# 解决导入路径问题
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入两个蓝图
from data_transport.device_transport import device_transport_bp
from data_transport.model_transport import model_transport_bp  # 新增导入

# 创建Flask应用
app = Flask(__name__, static_folder='.', static_url_path='')

# 注册蓝图
app.register_blueprint(device_transport_bp)
app.register_blueprint(model_transport_bp)  # 新增注册

# 启动服务
if __name__ == '__main__':
    from flask_cors import CORS
    CORS(app)
    app.run(host='0.0.0.0', port=5000, debug=True)