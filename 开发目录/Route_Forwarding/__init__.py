from flask import Blueprint

# 创建主蓝图，统一管理所有路由
main_bp = Blueprint('main', __name__)

# 导入子路由模块，注册到蓝图
def register_routes():
    from 开发目录.Route_Forwarding import page_routes
    from 开发目录.Route_Forwarding import api_routes