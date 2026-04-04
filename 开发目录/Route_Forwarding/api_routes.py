from flask import request, jsonify, session, send_from_directory
from 开发目录.Route_Forwarding import main_bp
from 开发目录.app import (
    app, login_required, UPLOAD_FOLDER, RESULT_FOLDER,
    DB_ENABLED, gpu_available, llm_analyzer,
    yolov11_detect, rtdetr_detect, yolov11_pose_detect,
    age_gender_detector, c2pnet,
    save_detection_record, get_all_detection_records,
    update_detection_record_llm,
    save_collection_data, get_all_collection_data,
    get_collection_data_by_scene,
    insert_detection_record,
    import_users, import_detection_records,
    import_devices, import_models, import_login_logs,
    datetime, os, json, uuid, glob, cv2, psutil, pynvml,
    random, string
)

# ==========================
# 全局变量（从主app同步）
# ==========================
current_deployed_model = "yolov11"

# ==========================
# 验证码生成接口
# ==========================
@main_bp.route('/api/generate-code', methods=['GET'])
def generate_code():
    try:
        char_set = string.ascii_uppercase + string.digits
        code = ''.join(random.choices(char_set, k=4))
        session['verify_code'] = code
        return jsonify({'success': True, 'code': code})
    except Exception as e:
        print(f"生成验证码失败：{e}")
        return jsonify({'success': False, 'msg': '生成验证码失败'})

# ==========================
# 登录/登出接口
# ==========================
@main_bp.route('/api/verify-login', methods=['POST'])
def verify_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        verify_code = data.get('verifyCode')

        if not verify_code:
            return jsonify({'success': False, 'msg': '请输入验证码'})

        session_code = session.get('verify_code')
        if not session_code or verify_code.upper() != session_code.upper():
            return jsonify({'success': False, 'msg': '验证码错误'})

        log_dir = os.path.join(os.path.dirname(__file__), '..', 'log')
        os.makedirs(log_dir, exist_ok=True)
        users_path = os.path.join(log_dir, 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        for user in users:
            if user.get('username') == username and user.get('password') == password:
                session.permanent = True
                session['username'] = username
                session['login_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                session.pop('verify_code', None)

                login_log_path = os.path.join(log_dir, 'login_log.json')
                login_log = {
                    "username": username,
                    "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "ip": request.remote_addr,
                    "location": "未知位置",
                    "type": "正常登录"
                }

                if os.path.exists(login_log_path):
                    with open(login_log_path, 'r', encoding='utf-8') as f:
                        logs = json.load(f)
                else:
                    logs = []

                logs.append(login_log)
                logs = logs[-10:]
                with open(login_log_path, 'w', encoding='utf-8') as f:
                    json.dump(logs, f, ensure_ascii=False, indent=4)

                return jsonify({'success': True, 'msg': '登录成功'})

        return jsonify({'success': False, 'msg': '账号或密码错误'})
    except Exception as e:
        print(f'登录验证失败：{e}')
        return jsonify({'success': False, 'msg': '登录失败，请重试'})

@main_bp.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'msg': '登出成功'})

# ==========================
# 注册接口
# ==========================
@main_bp.route('/api/register', methods=['POST'])
def user_register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        inviteCode = data.get('inviteCode')

        if not username or not password or not inviteCode:
            return jsonify({'code': 400, 'msg': '账号、密码、邀请码不能为空'})

        INVITE_CODE_CORRECT = "POLAR_GUARD_SUCESS"
        invite_status = False
        if inviteCode.strip() == INVITE_CODE_CORRECT:
            invite_status = True
        else:
            return jsonify({'code': 400, 'msg': '邀请码输入错误'})

        log_dir = os.path.join(os.path.dirname(__file__), '..', 'log')
        os.makedirs(log_dir, exist_ok=True)
        users_path = os.path.join(log_dir, 'users.json')

        if os.path.exists(users_path):
            with open(users_path, 'r', encoding='utf-8') as f:
                users = json.load(f)
        else:
            users = []

        for user in users:
            if user.get('username') == username:
                return jsonify({'code': 409, 'msg': '该账号已被注册'})

        new_user = {
            "username": username,
            "password": password,
            "inviteCode": invite_status,
            "phone": "",
            "name": "",
            "jobNo": "",
            "notifyEmail": "",
            "create_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "nickname": "未命名",
            "realName": "未命名",
            "userId": "未分配",
            "jobNumber": "未分配",
            "role": "普通用户",
            "auth": "基础权限",
            "bioVerify": "未录入",
            "avatar": "https://modao.cc/agent-py/media/generated_images/2026-03-18/3fc0139ebe274f268819b87bcbb7263f.jpg",
            "score": "0.0"
        }

        users.append(new_user)
        with open(users_path, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=4)

        if DB_ENABLED:
            try:
                import_users()
                print(f"🟢 [DB] 新用户 {username} 已同步到数据库")
            except Exception as e:
                print(f"🔴 [DB] 用户同步失败：{e}")

        return jsonify({'code': 200, 'msg': '注册成功'})
    except Exception as e:
        print(f'注册失败：{e}')
        return jsonify({'code': 500, 'msg': f'服务器错误：{str(e)}'})

# ==========================
# 获取当前用户信息
# ==========================
@main_bp.route('/api/current-user', methods=['GET'])
@login_required
def get_current_user():
    try:
        username = session.get('username')
        log_dir = os.path.join(os.path.dirname(__file__), '..', 'log')
        users_path = os.path.join(log_dir, 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        current_user = None
        for user in users:
            if user.get('username') == username:
                current_user = user
                break

        if not current_user:
            return jsonify({"success": False, "msg": "用户信息不存在"}), 404

        invite_status = current_user.get('inviteCode', False)
        role_name = "管理员" if invite_status else "普通用户"
        auth_name = "核心权限" if invite_status else "基础权限"

        user_info = {
            "username": current_user.get('username', '未命名'),
            "nickname": current_user.get('nickname', '未命名'),
            "realName": current_user.get('realName', '未命名'),
            "userId": current_user.get('userId', '未分配'),
            "jobNumber": current_user.get('jobNumber', '未分配'),
            "role": role_name,
            "auth": auth_name,
            "phone": current_user.get('phone', '未绑定'),
            "email": current_user.get('notifyEmail') or current_user.get('email', '未绑定'),
            "bioVerify": current_user.get('bioVerify', '未录入'),
            "avatar": current_user.get('avatar', 'https://modao.cc/agent-py/media/generated_images/2026-03-18/3fc0139ebe274f268819b87bcbb7263f.jpg'),
            "score": current_user.get('score', '0.0')
        }
        return jsonify({"success": True, "data": user_info})
    except Exception as e:
        print(f"获取用户信息失败：{e}")
        return jsonify({"success": False, "msg": f"获取用户信息失败：{str(e)}"}), 500

# ==========================
# 登录日志接口
# ==========================
@main_bp.route('/api/login-logs', methods=['GET'])
@login_required
def get_login_logs():
    try:
        username = session.get('username')
        login_log_path = os.path.join(os.path.dirname(__file__), '..', 'log', 'login_log.json')
        if os.path.exists(login_log_path):
            with open(login_log_path, 'r', encoding='utf-8') as f:
                all_logs = json.load(f)
        else:
            all_logs = []

        user_logs = [log for log in all_logs if log.get('username') == username]
        user_logs.sort(key=lambda x: x['time'], reverse=True)
        return jsonify({"success": True, "data": user_logs})
    except Exception as e:
        print(f"读取登录日志失败：{e}")
        return jsonify({"success": False, "msg": str(e)}), 500

# ==========================
# 更新用户信息
# ==========================
@main_bp.route('/api/update-user', methods=['POST'])
@login_required
def update_user():
    try:
        username = session.get('username')
        data = request.get_json()
        realName = data.get('realName', '')
        phone = data.get('phone', '')
        email = data.get('email', '')
        nickname = data.get('nickname', '')
        jobNumber = data.get('jobNumber', '')
        bioVerify = data.get('bioVerify', '')

        log_dir = os.path.join(os.path.dirname(__file__), '..', 'log')
        users_path = os.path.join(log_dir, 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        updated = False
        for user in users:
            if user.get('username') == username:
                user['realName'] = realName
                user['phone'] = phone
                user['email'] = email
                user['nickname'] = nickname
                user['jobNumber'] = jobNumber
                if bioVerify:
                    user['bioVerify'] = bioVerify
                updated = True
                break

        if not updated:
            return jsonify({"success": False, "msg": "用户不存在"}), 404

        with open(users_path, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

        return jsonify({"success": True, "msg": "保存成功"})
    except Exception as e:
        print("保存错误:", e)
        return jsonify({"success": False, "msg": "保存失败：" + str(e)}), 500

# ==========================
# 修改密码
# ==========================
@main_bp.route('/api/update-password', methods=['POST'])
@login_required
def update_password():
    try:
        username = session.get('username')
        data = request.get_json()
        old_pwd = data.get('oldPassword')
        new_pwd = data.get('newPassword')
        confirm_pwd = data.get('confirmPassword')

        if not old_pwd or not new_pwd or not confirm_pwd:
            return jsonify({"success": False, "msg": "请填写完整"})
        if new_pwd != confirm_pwd:
            return jsonify({"success": False, "msg": "两次密码不一致"})
        if len(new_pwd) < 6:
            return jsonify({"success": False, "msg": "密码长度至少6位"})

        log_dir = os.path.join(os.path.dirname(__file__), '..', 'log')
        users_path = os.path.join(log_dir, 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        user_found = None
        for user in users:
            if user.get('username') == username:
                user_found = user
                break

        if not user_found:
            return jsonify({"success": False, "msg": "用户不存在"})
        if user_found.get('password') != old_pwd:
            return jsonify({"success": False, "msg": "原密码错误"})

        user_found['password'] = new_pwd
        with open(users_path, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

        if DB_ENABLED:
            try:
                import_users()
            except:
                pass

        return jsonify({"success": True, "msg": "密码修改成功，请重新登录"})
    except Exception as e:
        print("修改密码错误:", e)
        return jsonify({"success": False, "msg": "修改失败：" + str(e)}), 500

# ==========================
# 生物验证更新
# ==========================
@main_bp.route('/api/update-bio-verify', methods=['POST'])
@login_required
def update_bio_verify():
    try:
        username = session.get('username')
        data = request.get_json()
        bioVerify = data.get('bioVerify', '未录入')

        log_dir = os.path.join(os.path.dirname(__file__), '..', 'log')
        users_path = os.path.join(log_dir, 'users.json')
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)

        updated = False
        for user in users:
            if user.get('username') == username:
                user['bioVerify'] = bioVerify
                updated = True
                break

        if not updated:
            return jsonify({"success": False, "msg": "用户不存在"}), 404

        with open(users_path, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

        if DB_ENABLED:
            try:
                import_users()
            except:
                pass

        return jsonify({"success": True, "msg": "生物验证状态更新成功", "bioVerify": bioVerify})
    except Exception as e:
        print("生物验证更新错误:", e)
        return jsonify({"success": False, "msg": "更新失败：" + str(e)}), 500

# ==========================
# 模型切换
# ==========================
@main_bp.route('/api/set_current_model', methods=['POST'])
@login_required
def set_current_model():
    global current_deployed_model
    try:
        data = request.json
        model_key = data.get('model')

        model_map = {
            "yolov11_detect": "yolov11",
            "c2pnet_dehaze": "c2pnet",
            "cawm_maba": "cawm",
            "yolov11_pose": "yolov11_pose",
            "mediapipe_face": "mediapipe_face",
            "mediapipe_pose": "mediapipe_pose",
            "rt_detr": "rt_detr",
            "age_recognition": "age",
            "empty_1": "empty",
            "empty_2": "empty"
        }

        current_deployed_model = model_map.get(model_key, "yolov11")
        return jsonify({"success": True, "current_model": current_deployed_model})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500

@main_bp.route('/api/get_current_model', methods=['GET'])
@login_required
def get_current_model():
    return jsonify({"success": True, "current_model": current_deployed_model})

# ==========================
# 设备状态
# ==========================
@main_bp.route('/api/device_status', methods=['GET'])
@login_required
def device_status():
    try:
        gpu_used = 0
        gpu_total = 24
        if gpu_available:
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
            gpu_used = round(mem.used / 1024**3, 1)
            gpu_total = round(mem.total / 1024**3, 1)

        mem = psutil.virtual_memory()
        mem_used = round(mem.used / 1024**3, 1)
        mem_total = round(mem.total / 1024**3, 1)

        return jsonify({
            "success": True,
            "gpu_used": gpu_used,
            "gpu_total": gpu_total,
            "mem_used": mem_used,
            "mem_total": mem_total
        })
    except:
        return jsonify({
            "success": True,
            "gpu_used": 0.0,
            "gpu_total": 24.0,
            "mem_used": 0.0,
            "mem_total": 32.0
        })

# ==========================
# 统一检测接口
# ==========================
@main_bp.route('/api/detect', methods=['POST'])
@login_required
def detect_image_api():
    try:
        file = request.files['image']
        model = request.form.get("model", current_deployed_model)

        file_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}.{file_ext}"
        upload_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(upload_path)

        if model == "yolov11":
            results, output_img_path, info = yolov11_detect(
                image_path=upload_path,
                model_path=os.path.join(os.path.dirname(__file__), '..', './detection/model_pt/yolo11s.pt'),
                save_dir=RESULT_FOLDER,
                show=False
            )
            if info['status'] == 'error':
                return jsonify({'success': False, 'msg': info['msg']}), 500

            result_text = f"检测完成：{info['detect_count']} 个目标\n"
            for cls in info['classes']:
                result_text += f"{cls['class']} {cls['confidence']}%\n"

            result_img_filename = os.path.basename(output_img_path)
            dirs = glob.glob(os.path.join(RESULT_FOLDER, 'predict*'))
            if dirs:
                latest_dir = os.path.basename(max(dirs, key=os.path.getctime))
                result_image_url = f"/results/{latest_dir}/{result_img_filename}"
            else:
                result_image_url = f"/results/{result_img_filename}"

            record_id = save_detection_record(
                detect_type="图片检测",
                detect_results=info['classes']
            )

            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "图片检测",
                        "detect_results": json.dumps(info['classes']),
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                except Exception as e:
                    print(f"🔴 [DB] 保存失败：{e}")

            return jsonify({
                "success": True,
                "detect_count": info['detect_count'],
                "avg_conf": round(sum([c['confidence'] for c in info['classes']])/info['detect_count'],2) if info['detect_count']>0 else 0,
                "result_image_url": result_image_url,
                "result_text": result_text,
                "classes": info['classes'],
                "latency": 12,
                "saved_filename": unique_filename,
                "record_id": record_id
            })

        elif model == "c2pnet":
            srcimg = cv2.imread(upload_path)
            dstimg = c2pnet.detect(srcimg)
            dehaze_folder = os.path.join(os.path.dirname(__file__), '..', "dehaze_results")
            os.makedirs(dehaze_folder, exist_ok=True)
            result_filename = f"dehaze_{unique_filename}"
            save_path = os.path.join(dehaze_folder, result_filename)
            cv2.imwrite(save_path, dstimg)

            result_image_url = f"/dehaze_results/{result_filename}"
            record_id = save_detection_record(detect_type="图像去雾", detect_results=[])

            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "图像去雾",
                        "detect_results": "[]",
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                except:
                    pass

            return jsonify({
                "success": True,
                "detect_count": 0,
                "avg_conf": 0,
                "result_image_url": result_image_url,
                "result_text": "C2PNet 去雾完成\n图像清晰度已提升",
                "classes": [],
                "latency": 18,
                "saved_filename": unique_filename,
                "record_id": record_id
            })

        elif model == "rt_detr":
            results, output_img_path, info = rtdetr_detect(
                image_path=upload_path,
                model_path=os.path.join(os.path.dirname(__file__), '..', './detection/model_pt/rtdetr-l.pt'),
                save_dir=RESULT_FOLDER,
                show=False
            )
            if info['status'] == 'error':
                return jsonify({'success': False, 'msg': info['msg']}), 500

            result_text = f"RT-DETR 检测完成：{info['detect_count']} 个目标\n"
            for cls in info['classes']:
                result_text += f"{cls['class']} {cls['confidence']}%\n"

            result_image_url = f"/results/{os.path.basename(output_img_path)}"
            record_id = save_detection_record(detect_type="RT-DETR检测", detect_results=info['classes'])

            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "RT-DETR检测",
                        "detect_results": json.dumps(info['classes']),
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                except:
                    pass

            return jsonify({
                "success": True,
                "detect_count": info['detect_count'],
                "avg_conf": round(sum([c['confidence'] for c in info['classes']])/info['detect_count'],2) if info['detect_count']>0 else 0,
                "result_image_url": result_image_url,
                "result_text": result_text,
                "classes": info['classes'],
                "latency": 15,
                "saved_filename": unique_filename,
                "record_id": record_id
            })

        elif model == "yolov11_pose":
            results, output_img_path, info = yolov11_pose_detect(
                image_path=upload_path,
                model_path=os.path.join(os.path.dirname(__file__), '..', './detection/model_pt/yolo11s-pose.pt'),
                save_dir=RESULT_FOLDER,
                show=False
            )
            if info['status'] == 'error':
                return jsonify({'success': False, 'msg': info['msg']}), 500

            result_text = f"姿态估计完成：{info['detect_count']} 个人体\n"
            for cls in info['classes']:
                result_text += f"{cls['class']} {cls['confidence']}% | 姿态: {cls['pose_label']}\n"

            result_img_filename = os.path.basename(output_img_path)
            result_image_url = f"/results/{result_img_filename}"

            record_id = save_detection_record(
                detect_type="姿态估计",
                detect_results=info['classes']
            )

            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "姿态估计",
                        "detect_results": json.dumps(info['classes']),
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                except:
                    pass

            return jsonify({
                "success": True,
                "detect_count": info['detect_count'],
                "avg_conf": round(sum([c['confidence'] for c in info['classes']]) / info['detect_count'], 2) if info['detect_count']>0 else 0,
                "result_image_url": result_image_url,
                "result_text": result_text,
                "classes": info['classes'],
                "latency": 14,
                "saved_filename": unique_filename,
                "record_id": record_id
            })

        elif model == "age":
            info = age_gender_detector.detect(
                image_path=upload_path,
                save_dir=RESULT_FOLDER
            )
            if info['status'] == 'error':
                return jsonify({'success': False, 'msg': info['msg']}), 500

            result_text = f"年龄/性别检测完成：{info['detect_count']} 个人脸\n"
            for cls in info['classes']:
                result_text += f"{cls['class']} {cls['confidence']}%\n"

            result_image_url = f"/results/{os.path.basename(info['output_img_path'])}"
            record_id = save_detection_record(detect_type="年龄/性别检测", detect_results=info['classes'])

            if DB_ENABLED:
                try:
                    data = {
                        "record_id": record_id,
                        "detect_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "detect_type": "年龄/性别检测",
                        "detect_results": json.dumps(info['classes']),
                        "llm_suggestion": ""
                    }
                    insert_detection_record(data)
                except Exception as e:
                    print(f"🔴 [DB] 保存失败：{e}")

            return jsonify({
                "success": True,
                "detect_count": info['detect_count'],
                "avg_conf": round(sum([c['confidence'] for c in info['classes']])/info['detect_count'],2) if info['detect_count']>0 else 0,
                "result_image_url": result_image_url,
                "result_text": result_text,
                "classes": info['classes'],
                "latency": 10,
                "saved_filename": unique_filename,
                "record_id": record_id
            })
        else:
            return jsonify({"success": False, "msg": "该模型暂未实现"}), 400

    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500

# ==========================
# 环境分析
# ==========================
@main_bp.route('/api/analyze_environment', methods=['POST'])
@login_required
def analyze_environment():
    try:
        data = request.json
        short_filename = data.get('image_path', '')
        full_image_path = os.path.join(UPLOAD_FOLDER, short_filename)
        image_desc = data.get('env_desc', '') or data.get('detect_result', '')
        record_id = data.get('record_id', '')

        result = llm_analyzer.analyze_image(image_path=full_image_path, image_desc=image_desc)
        if record_id:
            update_detection_record_llm(record_id, f"环境：{result['environment_type']} | 建议：{';'.join(result['protection_suggestions'])}")
        return jsonify({"success": True, "data": result})
    except Exception as e:
        fallback = llm_analyzer.get_local_fallback_result(data.get('env_desc',''))
        return jsonify({"success": True, "data": fallback})

# ==========================
# 检测记录
# ==========================
@main_bp.route('/api/detection_records', methods=['GET'])
@login_required
def get_detection_records_api():
    try:
        records = get_all_detection_records()
        return jsonify({"success": True, "records": records, "total": len(records)})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}),500

# ==========================
# 同步JSON到数据库
# ==========================
@main_bp.route('/api/sync_json_to_db', methods=['POST'])
@login_required
def sync_json_to_db():
    if not DB_ENABLED:
        return jsonify({"success": False, "msg": "数据库未连接"})
    try:
        import_detection_records()
        import_devices()
        import_models()
        import_users()
        return jsonify({"success": True, "msg": "同步成功"})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)})

# ==========================
# 静态文件服务
# ==========================
@main_bp.route('/results/<path:file_path>')
def serve_result_image(file_path):
    try:
        return send_from_directory(RESULT_FOLDER, file_path)
    except:
        return send_from_directory('static', 'default.png')

@main_bp.route('/dehaze_results/<filename>')
def get_dehaze_img(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', "dehaze_results"), filename)

@main_bp.route('/uploads/<filename>')
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ==========================
# 数据采集接口
# ==========================
@main_bp.route('/api/data_collection', methods=['POST'])
@login_required
def api_data_collection():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "msg": "无效数据"}), 400
        if data.get("scene") == "factory" and not data.get("specific_info", {}).get("worker_id"):
            return jsonify({"success": False, "msg": "工厂场景工号为必填项"}), 400
        save_collection_data(data)
        return jsonify({"success": True, "msg": "数据采集成功"})
    except Exception as e:
        return jsonify({"success": False, "msg": str(e)}), 500

@main_bp.route('/api/data_collection/records')
@login_required
def api_data_collection_records():
    scene = request.args.get("scene", "")
    if scene:
        data = get_collection_data_by_scene(scene)
    else:
        data = get_all_collection_data()
    return jsonify({"success": True, "records": data})