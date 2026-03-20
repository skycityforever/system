from flask import Flask
import os
import sys

# 解决导入路径问题（将开发目录加入Python路径）
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入蓝图（此时device_transport.py不再导入app，循环依赖消除）
from data_transport.device_transport import device_transport_bp

# 创建Flask应用
app = Flask(__name__, static_folder='.', static_url_path='')

# 注册蓝图（核心：将蓝图挂载到app上）
app.register_blueprint(device_transport_bp)

# 启动服务
if __name__ == '__main__':
    # 允许跨域访问（解决前端本地文件访问后端的跨域问题）
    from flask_cors import CORS

    CORS(app)

    # 启动服务（端口建议用5000，避免和IDE端口冲突）
    app.run(host='0.0.0.0', port=5000, debug=True)