from flask import Flask
from 开发目录.data_transport.device_transport import device_transport_bp

app = Flask(__name__)

# 注册设备传输蓝图
app.register_blueprint(device_transport_bp)

if __name__ == '__main__':
    app.run(debug=True)