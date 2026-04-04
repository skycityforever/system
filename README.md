```
开发目录/
├── .idea/                  # IDE 配置文件
├── 开发日志/                # 项目开发记录
├── 开发目录/                # 真实源码主目录（你的 Flask + 模型系统）
│   ├── Route_Forwarding/    # 路由蓝图（页面 + API）
│   │   ├── __init__.py
│   │   ├── page_routes.py   # 页面路由
│   │   └── api_routes.py    # 接口路由
│   ├── detection/          # 目标检测模型（YOLO、RTDETR、姿态、年龄性别）
│   ├── data_transport/      # 数据传输、设备、模型、仪表盘模块
│   ├── llm_integration/     # 大模型环境分析集成
│   ├── database_controller/ # 数据库控制器
│   ├── static/              # 前端静态资源（CSS/JS/图片）
│   ├── templates/           # HTML 页面模板
│   ├── uploads/             # 上传图片存储
│   ├── runs/                # 检测结果输出
│   ├── dehaze_results/       # 去雾结果输出
│   ├── log/                 # 用户、登录日志 JSON
│   ├── app.py                # 系统主入口（Flask）
│   └── 各类模型权重文件 / ONNX 文件
├── 测试报告/                # 功能/性能测试记录
├── 资料/                    # 项目参考资料、文档
├── 项目说明/                # 项目介绍、使用说明
└── README.md                # 项目说明文件
```
