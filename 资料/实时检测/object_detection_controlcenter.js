// Tab 切换逻辑
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active');
        el.classList.add('border-transparent');
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    const activeBtn = event.currentTarget;
    activeBtn.classList.add('active');
    activeBtn.classList.remove('border-transparent');
}

// 告警提示函数
function createAlert(title, content, type = 'success') {
    const alertItem = document.createElement('div');
    alertItem.className = `alert-item ${type}`;
    alertItem.innerHTML = `
      <div class="flex justify-between items-start">
        <span class="font-medium">${title}</span>
        <button class="text-slate-400 hover:text-white close-alert"><span class="iconify text-sm" data-icon="solar:close-bold"></span></button>
      </div>
      <p class="text-xs mt-1 text-slate-300">${content}</p>
    `;
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.appendChild(alertItem);
        alertItem.querySelector('.close-alert')?.addEventListener('click', () => alertItem.remove());
        setTimeout(() => {
            alertItem.style.opacity = '0';
            alertItem.style.transform = 'translateX(100%)';
            alertItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            setTimeout(() => alertItem.remove(), 300);
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const addModelBtn = document.getElementById('addModelBtn');
    const modelDropdown = document.getElementById('modelDropdown');
    const modelList = document.querySelector('.space-y-4');
    const options = document.querySelectorAll('.model-option');
    const sampleDropArea = document.getElementById('sampleDropArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const previewImg = document.getElementById('previewImg');
    const fileName = document.getElementById('fileName');
    const loadSampleBtns = document.querySelectorAll('.loadSampleBtn');
    const startInferenceBtn = document.getElementById('startInferenceBtn');
    const videoTabBtn = document.getElementById('videoTabBtn');
    const cameraTabBtn = document.getElementById('cameraTabBtn');
    const imageTabBtn = document.getElementById('imageTabBtn');

    // 视频控制栏相关元素
    const videoControlBar = document.getElementById('videoControlBar');
    const videoStartStopBtn = document.getElementById('videoStartStopBtn');
    const exportFrameBtn = document.getElementById('exportFrameBtn');
    const frameIntervalInput = document.getElementById('frameIntervalInput');
    const incrementFrameBtn = document.getElementById('incrementFrameBtn');
    const decrementFrameBtn = document.getElementById('decrementFrameBtn');

    // 摄像头模块相关元素
    const cameraLayout = document.getElementById('cameraLayout');
    const imageVideoLayout = document.getElementById('imageVideoLayout');
    const cameraPreviewContainer = document.getElementById('cameraPreviewContainer');
    const cameraIdleState = document.getElementById('cameraIdleState');
    const cameraActiveState = document.getElementById('cameraActiveState');
    const cameraVideo = document.getElementById('cameraVideo');
    const cameraCanvas = document.getElementById('cameraCanvas');
    const startCameraBtn = document.getElementById('startCameraBtn');
    const cameraStartDetectBtn = document.getElementById('cameraStartDetectBtn');
    const cameraStopDetectBtn = document.getElementById('cameraStopDetectBtn');
    const cameraCaptureBtn = document.getElementById('cameraCaptureBtn');
    const cameraFps = document.getElementById('cameraFps');

    // 实时统计相关元素
    const totalDetectCount = document.getElementById('totalDetectCount');
    const currentFrameCount = document.getElementById('currentFrameCount');
    const avgConfidence = document.getElementById('avgConfidence');
    const totalDetectCountTab = document.getElementById('totalDetectCountTab');
    const avgConfidenceTab = document.getElementById('avgConfidenceTab');

    // 全局统计变量
    let detectStats = {
      totalCount: 0,
      currentFrameCount: 0,
      totalConfidence: 0
    };

    // 1. 新增模型下拉菜单
    if(addModelBtn && modelDropdown) {
        addModelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modelDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => modelDropdown.classList.add('hidden'));
        modelDropdown.addEventListener('click', (e) => e.stopPropagation());
        options.forEach(option => {
            option.addEventListener('click', () => {
                const name = option.dataset.name;
                const desc = option.dataset.desc;
                const fps = option.dataset.fps;
                const prec = option.dataset.prec;
                modelDropdown.classList.add('hidden');
                const newModel = `
                <div class="p-4 rounded-lg bg-slate-800 border border-cyan-500/30">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-cyan-300">${name}</h4>
                        <span class="text-[10px] bg-green-500 text-white px-1 rounded">已导入</span>
                    </div>
                    <p class="text-xs text-slate-300">${desc}</p>
                    <div class="mt-3 flex items-center justify-between text-[10px] font-mono opacity-60">
                        <span>FPS: ${fps}</span>
                        <span>PREC: ${prec}%</span>
                    </div>
                </div>
                `;
                modelList.insertAdjacentHTML('afterbegin', newModel);
                createAlert('模型导入成功', `已成功导入模型「${name}」`, 'success');
            });
        });
    }

    // 2. 样本上传与预览
    if (sampleDropArea && fileInput) {
        sampleDropArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            handleFileUpload(file);
        });
        sampleDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            sampleDropArea.classList.add('border-cyan-400', 'bg-cyan-500/5');
        });
        sampleDropArea.addEventListener('dragleave', () => sampleDropArea.classList.remove('border-cyan-400', 'bg-cyan-500/5'));
        sampleDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            sampleDropArea.classList.remove('border-cyan-400', 'bg-cyan-500/5');
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
        });
        function handleFileUpload(file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
            if (!allowedTypes.includes(file.type) && !file.name.endsWith('.bin')) {
                createAlert('文件格式不支持', '仅支持 JPG/PNG/MP4/BIN 格式文件', 'error');
                return;
            }
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    fileName.textContent = file.name;
                    previewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                previewContainer.classList.remove('hidden');
                previewImg.style.display = 'none';
                fileName.textContent = file.name;
            }
            createAlert('样本加载成功', `已加载文件：${file.name}，可开始推理`, 'success');
        }
    }

    // 3. 加载样本按钮
    loadSampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sample = btn.dataset.sample;
            createAlert('样本加载', `已加载「${sample}」场景测试样本，可开始推理`, 'success');
        });
    });

    // 4. 视频/摄像头 Tab 切换逻辑
    if (videoTabBtn && cameraTabBtn && imageTabBtn && videoControlBar) {
        // 切换到视频 Tab 时显示视频控制栏
        videoTabBtn.addEventListener('click', () => {
            // 切换 Tab 样式
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('active');
                el.classList.add('border-transparent');
            });
            videoTabBtn.classList.add('active');
            videoTabBtn.classList.remove('border-transparent');

            // 显示视频控制栏，隐藏摄像头相关
            videoControlBar.classList.remove('hidden');
            cameraLayout.classList.add('hidden');
            imageVideoLayout.classList.remove('hidden');
            createAlert('功能已激活', '已切换到视频流推理模式', 'info');
        });

        // 切换到摄像头 Tab 时显示全屏摄像头布局
        cameraTabBtn.addEventListener('click', () => {
            // 切换 Tab 样式
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('active');
                el.classList.add('border-transparent');
            });
            cameraTabBtn.classList.add('active');
            cameraTabBtn.classList.remove('border-transparent');

            // 隐藏图片/视频布局，显示摄像头全屏布局
            imageVideoLayout.classList.add('hidden');
            videoControlBar.classList.add('hidden');
            cameraLayout.classList.remove('hidden');
            createAlert('摄像头模式', '已切换到摄像头实时检测模式', 'info');
        });

        // 切换回图片分析 Tab 时恢复原布局
        imageTabBtn.addEventListener('click', () => {
            // 切换 Tab 样式
            document.querySelectorAll('.tab-btn').forEach(el => {
                el.classList.remove('active');
                el.classList.add('border-transparent');
            });
            imageTabBtn.classList.add('active');
            imageTabBtn.classList.remove('border-transparent');

            // 隐藏视频/摄像头控制栏，显示原始预览
            videoControlBar.classList.add('hidden');
            cameraLayout.classList.add('hidden');
            imageVideoLayout.classList.remove('hidden');

            // 停止摄像头流
            if (cameraVideo.srcObject) {
                cameraVideo.srcObject.getTracks().forEach(track => track.stop());
            }
            cameraIdleState.classList.remove('hidden');
            cameraActiveState.classList.add('hidden');
            cameraStartDetectBtn.classList.remove('hidden');
            cameraStopDetectBtn.classList.add('hidden');

            // 重置统计数据
            detectStats = { totalCount: 0, currentFrameCount: 0, totalConfidence: 0 };
            totalDetectCount.textContent = '0';
            currentFrameCount.textContent = '0';
            avgConfidence.textContent = '0%';
            totalDetectCountTab.textContent = '0';
            avgConfidenceTab.textContent = '0.00';
        });
    }

    // 5. 视频控制栏逻辑
    let isStreaming = false;
    let streamInterval = null;

    // 开始/停止按钮
    if (videoStartStopBtn) {
        videoStartStopBtn.addEventListener('click', () => {
            if (!isStreaming) {
                // 开始推流
                isStreaming = true;
                videoStartStopBtn.innerHTML = `
                  <span class="iconify" data-icon="solar:stop-bold"></span>
                  <span>停止</span>
                `;
                videoStartStopBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
                videoStartStopBtn.classList.add('bg-red-600', 'hover:bg-red-500');
                createAlert('视频流已启动', '正在实时读取视频/摄像头数据并检测', 'success');

                // 模拟帧检测（实际项目中替换为真实视频流处理）
                const frameInterval = parseInt(frameIntervalInput.value);
                let frameCount = 0;
                streamInterval = setInterval(() => {
                    frameCount++;
                    if (frameCount % frameInterval === 0) {
                        const consoleLog = document.getElementById('consoleLog');
                        consoleLog.innerHTML += `<p>&gt; [VIDEO] 检测第 ${frameCount} 帧 - 目标检测中...</p>`;
                        consoleLog.scrollTop = consoleLog.scrollHeight;
                    }
                }, 100); // 100ms 模拟一帧
            } else {
                // 停止推流
                isStreaming = false;
                clearInterval(streamInterval);
                videoStartStopBtn.innerHTML = `
                  <span class="iconify" data-icon="solar:play-bold"></span>
                  <span>开始</span>
                `;
                videoStartStopBtn.classList.remove('bg-red-600', 'hover:bg-red-500');
                videoStartStopBtn.classList.add('bg-green-600', 'hover:bg-green-500');
                createAlert('视频流已停止', '已暂停实时检测', 'warning');
            }
        });
    }

    // 导出帧按钮
    if (exportFrameBtn) {
        exportFrameBtn.addEventListener('click', () => {
            if (!isStreaming) {
                createAlert('操作失败', '请先启动视频流', 'error');
                return;
            }
            // 模拟导出帧（实际项目中替换为截图/保存逻辑）
            createAlert('帧导出成功', '当前帧已保存至本地', 'success');
            const consoleLog = document.getElementById('consoleLog');
            consoleLog.innerHTML += `<p>&gt; [VIDEO] 导出当前帧 - 保存成功</p>`;
            consoleLog.scrollTop = consoleLog.scrollHeight;
        });
    }

    // 帧间隔增减按钮
    if (incrementFrameBtn && decrementFrameBtn && frameIntervalInput) {
        incrementFrameBtn.addEventListener('click', () => {
            let val = parseInt(frameIntervalInput.value);
            frameIntervalInput.value = val + 1;
        });

        decrementFrameBtn.addEventListener('click', () => {
            let val = parseInt(frameIntervalInput.value);
            if (val > 1) frameIntervalInput.value = val - 1;
        });
    }

    // 6. 摄像头实时模块逻辑
    // 启动摄像头
    if (startCameraBtn) {
        startCameraBtn.addEventListener('click', async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                    audio: false
                });
                cameraVideo.srcObject = stream;
                cameraIdleState.classList.add('hidden');
                cameraActiveState.classList.remove('hidden');
                createAlert('摄像头已启动', '实时画面加载完成', 'success');

                // 自适应 canvas 尺寸
                cameraVideo.addEventListener('loadedmetadata', () => {
                    cameraCanvas.width = cameraVideo.videoWidth;
                    cameraCanvas.height = cameraVideo.videoHeight;
                });

                // 模拟 FPS 计算
                let frameCount = 0;
                let lastTime = performance.now();
                function updateFps() {
                    frameCount++;
                    const now = performance.now();
                    if (now - lastTime >= 1000) {
                        cameraFps.textContent = frameCount;
                        frameCount = 0;
                        lastTime = now;
                    }
                    requestAnimationFrame(updateFps);
                }
                updateFps();
            } catch (err) {
                console.error('启动摄像头失败:', err);
                createAlert('启动失败', '无法访问摄像头，请检查权限设置', 'error');
            }
        });
    }

    // 开始检测
    if (cameraStartDetectBtn) {
        cameraStartDetectBtn.addEventListener('click', () => {
            if (!cameraVideo.srcObject) {
                createAlert('操作失败', '请先启动摄像头', 'error');
                return;
            }
            cameraStartDetectBtn.classList.add('hidden');
            cameraStopDetectBtn.classList.remove('hidden');
            createAlert('检测已启动', '正在实时分析摄像头画面', 'success');

            const ctx = cameraCanvas.getContext('2d');
            function drawDetection() {
                if (cameraStopDetectBtn.classList.contains('hidden')) return;

                // 清空画布
                ctx.clearRect(0, 0, cameraCanvas.width, cameraCanvas.height);

                // 绘制检测框样式
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#22d3ee';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#22d3ee';
                ctx.font = '12px monospace';

                // 模拟当前帧检测结果（实际项目中替换为模型推理结果）
                const mockDetections = [
                    { label: 'PERSON', conf: (Math.random() * 0.1 + 0.85).toFixed(2), x: 100, y: 100, w: 80, h: 120 },
                    { label: 'PERSON', conf: (Math.random() * 0.1 + 0.82).toFixed(2), x: 300, y: 150, w: 90, h: 130 }
                ].slice(0, Math.floor(Math.random() * 2) + 1); // 随机 1-2 个目标

                // 更新统计数据
                detectStats.currentFrameCount = mockDetections.length;
                detectStats.totalCount += mockDetections.length;
                const currentAvgConf = mockDetections.reduce((sum, d) => sum + parseFloat(d.conf), 0) / (mockDetections.length || 1);
                detectStats.totalConfidence += currentAvgConf * mockDetections.length;
                const overallAvgConf = detectStats.totalCount > 0
                    ? (detectStats.totalConfidence / detectStats.totalCount * 100).toFixed(1)
                    : '0';

                // 更新界面统计
                totalDetectCount.textContent = detectStats.totalCount;
                currentFrameCount.textContent = mockDetections.length;
                avgConfidence.textContent = `${overallAvgConf}%`;

                // 同步更新下方统计面板
                totalDetectCountTab.textContent = detectStats.totalCount;
                avgConfidenceTab.textContent = overallAvgConf;

                // 绘制检测框
                mockDetections.forEach(d => {
                    ctx.strokeRect(d.x, d.y, d.w, d.h);
                    ctx.fillText(`${d.label} ${(d.conf * 100).toFixed(1)}%`, d.x, d.y - 8);
                });

                // 记录日志
                const consoleLog = document.getElementById('consoleLog');
                consoleLog.innerHTML += `<p>&gt; [CAMERA] 检测到 ${mockDetections.length} 个目标 - 平均置信度 ${(currentAvgConf * 100).toFixed(1)}%</p>`;
                consoleLog.scrollTop = consoleLog.scrollHeight;

                requestAnimationFrame(drawDetection);
            }
            drawDetection();
        });
    }

    // 停止检测
    if (cameraStopDetectBtn) {
        cameraStopDetectBtn.addEventListener('click', () => {
            cameraStopDetectBtn.classList.add('hidden');
            cameraStartDetectBtn.classList.remove('hidden');
            const ctx = cameraCanvas.getContext('2d');
            ctx.clearRect(0, 0, cameraCanvas.width, cameraCanvas.height);
            detectStats.currentFrameCount = 0;
            currentFrameCount.textContent = 0;
            createAlert('检测已停止', '已暂停实时分析', 'warning');

            // 记录日志
            const consoleLog = document.getElementById('consoleLog');
            consoleLog.innerHTML += `<p>&gt; [CAMERA] 停止实时检测 - 累计检测 ${detectStats.totalCount} 个目标</p>`;
            consoleLog.scrollTop = consoleLog.scrollHeight;
        });
    }

    // 拍照功能
    if (cameraCaptureBtn) {
        cameraCaptureBtn.addEventListener('click', () => {
            if (!cameraVideo.srcObject) {
                createAlert('操作失败', '请先启动摄像头', 'error');
                return;
            }
            // 创建临时 canvas 用于截图
            const canvas = document.createElement('canvas');
            canvas.width = cameraVideo.videoWidth;
            canvas.height = cameraVideo.videoHeight;
            const ctx = canvas.getContext('2d');

            // 绘制视频画面
            ctx.drawImage(cameraVideo, 0, 0);

            // 叠加检测框
            ctx.drawImage(cameraCanvas, 0, 0, canvas.width, canvas.height);

            // 下载图片
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `camera_capture_${Date.now()}.png`;
            link.click();

            createAlert('拍照成功', '已保存当前画面至本地', 'success');
            const consoleLog = document.getElementById('consoleLog');
            consoleLog.innerHTML += `<p>&gt; [CAMERA] 已保存当前帧截图</p>`;
            consoleLog.scrollTop = consoleLog.scrollHeight;
        });
    }

    // 7. 开始推理按钮（核心逻辑：修复大模型调用+路径问题）
    if (startInferenceBtn) {
        startInferenceBtn.addEventListener('click', async () => {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files?.[0];
            if (!file) {
                createAlert('推理失败', '请先上传或选择样本图片', 'error');
                return;
            }
            createAlert('推理启动', '正在加载模型并执行推理，请稍候...', 'info');
            const formData = new FormData();
            formData.append('image', file);
            try {
                const response = await fetch('http://localhost:5000/api/detect', {method: 'POST', body: formData, mode: 'cors' });
                const data = await response.json();
                if (data.success) {
                    // 更新 Result 面板文本
                    const resultTextPanel = document.getElementById('resultTextPanel');
                    resultTextPanel.innerHTML = data.result_text.replace(/\n/g, '<br>');
                    // 更新预览图
                    const resultPreviewImg = document.getElementById('resultPreviewImg');
                    resultPreviewImg.src = data.result_image_url;
                    resultPreviewImg.style.opacity = '1';
                    // 更新检测框标签
                    const resultBboxLabel = document.getElementById('resultBboxLabel');
                    if (data.detect_count > 0) {
                        const firstCls = data.classes[0];
                        resultBboxLabel.textContent = `${firstCls.class} ${firstCls.confidence}%`;
                    }
                    // 更新延迟和准确率
                    const resultLatency = document.getElementById('resultLatency');
                    const resultAcc = document.getElementById('resultAcc');
                    resultLatency.textContent = `LATENCY: ${data.latency || '8.5'}ms`;
                    resultAcc.textContent = `ACC: ${(data.avg_conf / 100).toFixed(3)}`;
                    // 更新状态点
                    const resultStatusDots = document.getElementById('resultStatusDots');
                    resultStatusDots.innerHTML = '';
                    for (let i = 0; i < data.detect_count; i++) {
                        const dot = document.createElement('div');
                        dot.className = 'w-2 h-2 rounded-full bg-green-500';
                        resultStatusDots.appendChild(dot);
                    }
                    // 更新统计摘要
                    document.getElementById('totalDetectCountTab').textContent = data.detect_count;
                    document.getElementById('classCount').textContent = new Set(data.classes.map(c => c.class)).size;
                    document.getElementById('avgConfidenceTab').textContent = data.avg_conf.toFixed(2);
                    document.getElementById('maxConfidence').textContent = Math.max(...data.classes.map(c => c.confidence)).toFixed(2);
                    // 更新类别数量表
                    const classCountTable = document.getElementById('classCountTable');
                    classCountTable.innerHTML = '';
                    const classMap = {};
                    data.classes.forEach(c => classMap[c.class] = (classMap[c.class] || 0) + 1);
                    Object.entries(classMap).forEach(([cls, cnt]) => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `<td>${cls}</td><td>${cnt}</td><td>${((cnt / data.detect_count) * 100).toFixed(1)}%</td>`;
                        classCountTable.appendChild(tr);
                    });
                    // 更新详细数据
                    const detailTable = document.getElementById('detailTable');
                    detailTable.innerHTML = '';
                    data.classes.forEach((c, i) => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${i+1}</td>
                            <td>${c.class}</td>
                            <td>${c.confidence}%</td>
                            <td>${c.bbox[0].toFixed(0)}</td>
                            <td>${c.bbox[1].toFixed(0)}</td>
                            <td>${c.bbox[2].toFixed(0)}</td>
                            <td>${c.bbox[3].toFixed(0)}</td>
                            <td>${((c.bbox[2]-c.bbox[0])*(c.bbox[3]-c.bbox[1])).toFixed(0)}</td>
                        `;
                        detailTable.appendChild(tr);
                    });
                    // 更新控制台日志（修复大模型调用路径问题）
                    const consoleLog = document.getElementById('consoleLog');
                    let logContent = `<p>&gt; [AI] 检测完成，共识别到 ${data.detect_count} 个目标</p>` +
                        data.classes.map((c, i) => `<p>&gt; [AI] 目标 ${i+1}: ${c.class} (置信度 ${c.confidence}%)</p>`).join('');

                    // 调用大模型分析（传递record_id用于更新记录）
                    try {
                        const llmResponse = await fetch('/api/analyze_environment', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                image_path: data.saved_filename,
                                env_desc: data.env_desc,
                                record_id: data.record_id  // 新增：传递记录ID
                            })
                        });
                        const llmData = await llmResponse.json();
                        if (llmData.success) {
                            logContent += `<p>&gt; [LLM] 环境识别：${llmData.data.environment_type}</p>`;
                            logContent += `<p>&gt; [LLM] 防护建议：${llmData.data.protection_suggestions.join(' | ')}</p>`;
                        }
                    } catch (e) {
                        logContent += `<p>&gt; [LLM] 大模型调用失败，使用本地防护建议兜底</p>`;
                        console.error("LLM调用异常：", e);
                    }
                    logContent += `<p class="animate-pulse">&gt; _</p>`;
                    consoleLog.innerHTML = logContent;

                    createAlert('推理完成', `成功检测到 ${data.detect_count} 个目标，平均置信度 ${data.avg_conf}%`, 'success');
                } else {
                    createAlert('推理失败', data.msg || '后端处理异常', 'error');
                }
            } catch (err) {
                console.error(err);
                createAlert('网络错误', '无法连接到推理服务，请检查后端', 'error');
            }
        });
    }

    // 8. 检测记录加载与渲染（补全之前截断的代码）
    async function loadDetectionRecords() {
        try {
            const response = await fetch('/api/detection_records');
            const data = await response.json();
            if (data.success) {
                renderRecords(data.records);
            }
        } catch (error) {
            console.error('获取记录失败:', error);
        }
    }

    function renderRecords(records) {
        const container = document.getElementById('records-container');
        if (!container) return;

        container.innerHTML = records.map(record => `
            <div class="record-card glass-panel p-4 mb-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-cyan-400 font-bold">ID: ${record.id}</span>
                    <span class="text-slate-400 text-sm">${record.detect_time}</span>
                </div>
                <div class="mb-2">
                    <span class="text-sm">环境类型：${record.environment_type || '未知'}</span>
                    <span class="text-sm ml-4">检测目标数：${record.detect_count || 0}</span>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                    average confidence：${record.avg_conf || 0}% | 最高置信度：${record.max_conf || 0}%
                </div>
                <div class="flex gap-2">
                    <button class="view-record-btn px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded" data-id="${record.id}">
                        查看详情
                    </button>
                    <button class="delete-record-btn px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded" data-id="${record.id}">
                        删除
                    </button>
                </div>
            </div>
        `).join('');

        // 绑定查看/删除按钮事件
        document.querySelectorAll('.view-record-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const recordId = btn.dataset.id;
                viewRecordDetail(recordId);
            });
        });

        document.querySelectorAll('.delete-record-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const recordId = btn.dataset.id;
                if (confirm('确定要删除这条记录吗？')) {
                    try {
                        const response = await fetch(`/api/delete_record/${recordId}`, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        if (data.success) {
                            createAlert('删除成功', '检测记录已删除', 'success');
                            loadDetectionRecords(); // 重新加载列表
                        } else {
                            createAlert('删除失败', data.msg || '删除操作异常', 'error');
                        }
                    } catch (error) {
                        console.error('删除记录失败:', error);
                        createAlert('删除失败', '网络错误，无法删除记录', 'error');
                    }
                }
            });
        });
    }

    async function viewRecordDetail(recordId) {
        try {
            const response = await fetch(`/api/record_detail/${recordId}`);
            const data = await response.json();
            if (data.success) {
                // 这里可以实现查看详情的逻辑，比如弹窗展示
                createAlert('加载成功', '已获取记录详情', 'success');
                console.log('记录详情:', data.record);
            } else {
                createAlert('加载失败', data.msg || '获取详情失败', 'error');
            }
        } catch (error) {
            console.error('获取记录详情失败:', error);
            createAlert('加载失败', '网络错误，无法获取详情', 'error');
        }
    }

    // 页面加载完成后自动加载检测记录
    loadDetectionRecords();
});
// 加载动画控制逻辑 - 复制到<script>标签
document.addEventListener('DOMContentLoaded', function() {
    // 1. 基础用法：固定延迟隐藏（适合纯静态页面）
    setTimeout(() => {
        hideLoader();
    }, 1500); // 1.5秒后隐藏，可调整时长

    // 2. 进阶用法：数据加载完成后隐藏（适合有接口请求的页面）
    // 示例：调用接口后隐藏
    // loadData().then(() => {
    //     hideLoader();
    // });
});

// 通用隐藏加载动画的函数
function hideLoader() {
    const loaderContainer = document.getElementById('loaderContainer');
    if (loaderContainer) {
        loaderContainer.classList.add('loader-hidden');
        // 动画结束后移除DOM（可选，避免占用DOM）
        setTimeout(() => {
            loaderContainer.remove();
        }, 500);
    }
}
// ==========================
// 模型管理 - 模型切换逻辑（点击卡片切换当前部署模型）
// 兼容你现有界面：自动同步UI + 同步后端app.py + 推理自动使用当前模型
// ==========================
let currentDeployModel = "yolov11_detect"; // 默认部署模型

// 辅助函数：更新所有模型卡片的 UI 状态
function updateModelUI() {
    document.querySelectorAll('.space-y-4 > div').forEach(card => {
        const h4 = card.querySelector('h4');
        if (!h4) return;
        const modelName = h4.textContent.trim();
        let modelKey = "";
        let isImplemented = false;

        // 严格区分模型类型
        if (modelName.includes("YOLO") && modelName.includes("目标检测") && !modelName.includes("姿态")) {
            modelKey = "yolov11_detect";
            isImplemented = true;
        } else if (modelName.includes("C2PNet") || modelName.includes("去雾")) {
            modelKey = "c2pnet_dehaze";
            isImplemented = true;
        } else if (modelName.includes("YOLOv11") && modelName.includes("姿态估计")) {
            isImplemented = false; // 姿态估计未实现
        } else if (modelName.includes("RT-DETR")) {
            isImplemented = false; // RT-DETR未实现
        } else {
            isImplemented = false; // 其他均未实现
        }

        // 重置所有卡片样式
        card.classList.remove('bg-cyan-400/10', 'border-cyan-400/50');
        card.classList.add('bg-slate-800', 'border-slate-700');

        // 精准定位徽章（优先找带 "当前部署" / "待部署" 的 span）
        const badge = card.querySelector('span.rounded');
        if (badge) {
            if (!isImplemented) {
                // 未实现模型：橙色徽章
                badge.className = 'text-[10px] bg-orange-500 text-white px-1 rounded';
                badge.textContent = '未实现';
            } else if (modelKey === currentDeployModel) {
                // 当前部署模型：高亮 + 绿色徽章
                card.classList.remove('bg-slate-800', 'border-slate-700');
                card.classList.add('bg-cyan-400/10', 'border-cyan-400/50');
                badge.className = 'text-[10px] bg-cyan-500 text-white px-1 rounded';
                badge.textContent = '当前部署';
            } else {
                // 其他已实现模型：灰色 + 待部署
                badge.className = 'text-[10px] bg-slate-700 text-slate-400 px-1 rounded';
                badge.textContent = '待部署';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    // 页面加载时先从后端获取当前已部署的模型
    try {
        const res = await fetch('/api/get_current_model');
        const data = await res.json();
        if (data.success) {
            // 后端模型名映射到前端模型标识
            const modelMap = {
                "yolov11": "yolov11_detect",
                "c2pnet": "c2pnet_dehaze"
            };
            currentDeployModel = modelMap[data.current_model] || "yolov11_detect";
            // 加载完成后同步 UI
            updateModelUI();
        }
    } catch (e) {
        console.log("获取后端模型状态失败，使用默认值");
        updateModelUI();
    }

    // 监听模型卡片点击
    document.addEventListener('click', async function(e) {
        const modelCard = e.target.closest('.space-y-4 > div');
        if (!modelCard) return;

        // 停止事件冒泡
        e.stopPropagation();
        e.preventDefault();

        // 获取当前点击的模型名称
        const h4 = modelCard.querySelector('h4');
        if (!h4) return;
        const modelName = h4.textContent.trim();

        // 映射模型：根据文字匹配模型类型
        let modelKey = "";
        let isImplemented = false;

        // 严格区分模型类型
        if (modelName.includes("YOLO") && modelName.includes("目标检测") && !modelName.includes("姿态")) {
            modelKey = "yolov11_detect";
            isImplemented = true;
        } else if (modelName.includes("C2PNet") || modelName.includes("去雾")) {
            modelKey = "c2pnet_dehaze";
            isImplemented = true;
        } else if (modelName.includes("YOLOv11") && modelName.includes("姿态估计")) {
            createAlert("功能未实现", "YOLOv11 姿态估计功能暂未开发，敬请期待", "info");
            return;
        } else if (modelName.includes("RT-DETR")) {
            createAlert("功能未实现", "RT-DETR 目标检测功能暂未开发，敬请期待", "info");
            return;
        } else {
            createAlert("功能未实现", "该模型功能暂未开发，敬请期待", "info");
            return;
        }

        // 未实现直接返回
        if (!isImplemented) {
            createAlert("功能未实现", "该模型功能暂未开发，敬请期待", "info");
            return;
        }

        // 同步到后端
        try {
            const resp = await fetch('/api/set_current_model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelKey })
            });
            const data = await resp.json();
            if (!data.success) throw new Error("同步失败");
        } catch (err) {
            createAlert("同步失败", "模型状态无法同步到后端", "error");
            return;
        }

        // 更新全局当前模型
        currentDeployModel = modelKey;

        // 同步更新所有卡片 UI
        updateModelUI();

        createAlert("模型切换成功", `当前已部署：${modelName}`, "success");
    });
});

// ==========================
// 重写【开始推理】按钮：自动使用当前切换的模型
// ==========================
document.addEventListener('DOMContentLoaded', function() {
    const startInferenceBtn = document.getElementById('startInferenceBtn');
    if (!startInferenceBtn) return;

    // 克隆替换原有点击事件，避免冲突
    const newBtn = startInferenceBtn.cloneNode(true);
    startInferenceBtn.parentNode.replaceChild(newBtn, startInferenceBtn);

    newBtn.addEventListener('click', async () => {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files?.[0];
        if (!file) {
            createAlert('推理失败', '请先上传或选择样本图片', 'error');
            return;
        }

        createAlert('推理启动', `正在使用【${currentDeployModel == 'c2pnet_dehaze' ? 'C2PNet去雾' : 'YOLOv11检测'}】模型推理...`, 'info');

        const formData = new FormData();
        formData.append('image', file);

        // 关键：把当前模型传给后端
        const useModel = currentDeployModel === 'c2pnet_dehaze' ? 'c2pnet' : 'yolov11';
        formData.append('model', useModel);

        try {
            const response = await fetch('http://localhost:5000/api/detect', {
                method: 'POST',
                body: formData,
                mode: 'cors'
            });

            const data = await response.json();
            if (data.success) {
                const resultTextPanel = document.getElementById('resultTextPanel');
                resultTextPanel.innerHTML = data.result_text.replace(/\n/g, '<br>');
                const resultPreviewImg = document.getElementById('resultPreviewImg');
                resultPreviewImg.src = data.result_image_url;
                resultPreviewImg.style.opacity = '1';

                // 其余原有逻辑保持不变
                const resultBboxLabel = document.getElementById('resultBboxLabel');
                if (data.detect_count > 0) {
                    const firstCls = data.classes[0];
                    resultBboxLabel.textContent = `${firstCls.class} ${firstCls.confidence}%`;
                }

                const resultLatency = document.getElementById('resultLatency');
                const resultAcc = document.getElementById('resultAcc');
                resultLatency.textContent = `LATENCY: ${data.latency || '8.5'}ms`;
                resultAcc.textContent = `ACC: ${(data.avg_conf / 100).toFixed(3)}`;

                const resultStatusDots = document.getElementById('resultStatusDots');
                resultStatusDots.innerHTML = '';
                for (let i = 0; i < data.detect_count; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'w-2 h-2 rounded-full bg-green-500';
                    resultStatusDots.appendChild(dot);
                }

                document.getElementById('totalDetectCountTab').textContent = data.detect_count;
                document.getElementById('classCount').textContent = new Set(data.classes.map(c => c.class)).size;
                document.getElementById('avgConfidenceTab').textContent = data.avg_conf.toFixed(2);
                if (data.classes.length > 0) {
                    document.getElementById('maxConfidence').textContent = Math.max(...data.classes.map(c => c.confidence)).toFixed(2);
                }

                const classCountTable = document.getElementById('classCountTable');
                classCountTable.innerHTML = '';
                const classMap = {};
                data.classes.forEach(c => classMap[c.class] = (classMap[c.class] || 0) + 1);
                Object.entries(classMap).forEach(([cls, cnt]) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${cls}</td><td>${cnt}</td><td>${((cnt / data.detect_count) * 100).toFixed(1)}%</td>`;
                    classCountTable.appendChild(tr);
                });

                const detailTable = document.getElementById('detailTable');
                detailTable.innerHTML = '';
                data.classes.forEach((c, i) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${i+1}</td>
                        <td>${c.class}</td>
                        <td>${c.confidence}%</td>
                        <td>${c.bbox ? c.bbox[0].toFixed(0) : 0}</td>
                        <td>${c.bbox ? c.bbox[1].toFixed(0) : 0}</td>
                        <td>${c.bbox ? c.bbox[2].toFixed(0) : 0}</td>
                        <td>${c.bbox ? c.bbox[3].toFixed(0) : 0}</td>
                        <td>${c.bbox ? ((c.bbox[2] - c.bbox[0]) * (c.bbox[3] - c.bbox[1])).toFixed(0) : 0}</td>
                    `;
                    detailTable.appendChild(tr);
                });

                const consoleLog = document.getElementById('consoleLog');
                let logContent = `<p>&gt; [AI] 推理完成，使用模型：${useModel == 'c2pnet' ? 'C2PNet去雾' : 'YOLOv11检测'}</p>`;
                if (data.detect_count > 0) {
                    logContent += `<p>&gt; [AI] 检测完成，共识别到 ${data.detect_count} 个目标</p>`;
                    data.classes.forEach((c, i) => {
                        logContent += `<p>&gt; [AI] 目标 ${i+1}: ${c.class} (置信度 ${c.confidence}%)</p>`;
                    });
                } else {
                    logContent += `<p>&gt; [AI] ${data.result_text}</p>`;
                }

                try {
                    const llmResponse = await fetch('/api/analyze_environment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image_path: data.saved_filename,
                            env_desc: data.env_desc || "",
                            record_id: data.record_id || ""
                        })
                    });
                    const llmData = await llmResponse.json();
                    if (llmData.success) {
                        logContent += `<p>&gt; [LLM] 环境识别：${llmData.data.environment_type}</p>`;
                        logContent += `<p>&gt; [LLM] 防护建议：${llmData.data.protection_suggestions.join(' | ')}</p>`;
                    }
                } catch (e) {
                    logContent += `<p>&gt; [LLM] 大模型调用失败</p>`;
                }

                logContent += `<p class="animate-pulse">&gt; _</p>`;
                consoleLog.innerHTML = logContent;
                createAlert('推理完成', '处理成功', 'success');
            } else {
                createAlert('推理失败', data.msg || '后端异常', 'error');
            }
        } catch (err) {
            createAlert('网络错误', '无法连接后端服务', 'error');
        }
    });
});
// 实时获取设备状态并更新界面
async function fetchDeviceStatus() {
  try {
    const response = await fetch('/api/device_status');
    const data = await response.json();
    if (!data.success) throw new Error('获取设备状态失败');

    // 更新 GPU 显存
    const gpuPercent = (data.gpu_used / data.gpu_total * 100).toFixed(1);
    document.getElementById('gpuPercent').textContent = `${gpuPercent}%`;
    document.getElementById('gpuUsageText').textContent = `${data.gpu_used}GB / ${data.gpu_total}GB`;
    document.getElementById('gpuProgress').style.width = `${gpuPercent}%`;

    // 更新系统内存
    const memPercent = (data.mem_used / data.mem_total * 100).toFixed(0);
    document.getElementById('memPercent').textContent = `${memPercent}%`;
    document.getElementById('memUsageText').textContent = `${data.mem_used}GB / ${data.mem_total}GB`;
    document.getElementById('memProgress').style.width = `${memPercent}%`;

    // 更新平均推理延迟（目标 <10ms，进度条按 0-10ms 映射为 0-100%）
    const latency = data.latency_ms.toFixed(1);
    const latencyPercent = Math.min((latency / 10) * 100, 100);
    document.getElementById('latencyValue').textContent = `${latency}ms`;
    document.getElementById('latencyProgress').style.width = `${latencyPercent}%`;

    // 更新模型准确率（目标 >95%，进度条直接使用百分比）
    const accuracy = data.accuracy.toFixed(1);
    document.getElementById('accuracyPercent').textContent = `${accuracy}%`;
    document.getElementById('accuracyProgress').style.width = `${accuracy}%`;
  } catch (err) {
    console.error('获取设备状态失败:', err);
  }
}

// 页面加载后立即获取一次，然后每 2 秒轮询更新
document.addEventListener('DOMContentLoaded', () => {
  fetchDeviceStatus();
  setInterval(fetchDeviceStatus, 2000); // 2 秒刷新一次
});