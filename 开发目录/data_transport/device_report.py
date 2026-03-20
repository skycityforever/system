import json

import jsonify
from flask import send_file
import pandas as pd
from io import BytesIO

from 开发目录.data_transport.device_transport import device_transport_bp, DEVICE_LOG_FILE


@device_transport_bp.route('/api/device/export/<device_id>', methods=['GET'])
def export_device_report(device_id):
    # 从 devices.json 读取设备数据
    with open(DEVICE_LOG_FILE, 'r', encoding='utf-8') as f:
        devices = json.load(f)
    device = next((d for d in devices if d['device_id'] == device_id), None)
    if not device:
        return jsonify({"status": "error", "msg": "设备不存在"}), 404

    # 生成 CSV
    df = pd.DataFrame([device])
    output = BytesIO()
    df.to_csv(output, index=False, encoding='utf-8-sig')
    output.seek(0)

    return send_file(
        output,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'设备报告_{device_id}.csv'
    )