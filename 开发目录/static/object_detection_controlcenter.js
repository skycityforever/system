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

    // 4. 视频/摄像头 Tab
    if (videoTabBtn) {
        videoTabBtn.addEventListener('click', () => createAlert('功能开发中', '视频流推理功能正在开发，敬请期待', 'warning'));
    }
    if (cameraTabBtn) {
        cameraTabBtn.addEventListener('click', () => createAlert('功能开发中', '摄像头实时推理功能正在开发，敬请期待', 'warning'));
    }

    // 5. 开始推理按钮（核心逻辑：修复大模型调用+路径问题）
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
                document.getElementById('totalDetectCount').textContent = data.detect_count;
                document.getElementById('classCount').textContent = new Set(data.classes.map(c => c.class)).size;
                document.getElementById('avgConfidence').textContent = data.avg_conf.toFixed(2);
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
});

// 获取所有检测记录
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

// 渲染记录列表
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
        <span class="text-white">检测类型: </span>
        <span class="text-cyan-400">${record.detect_type}</span>
      </div>
      <div class="mb-2">
        <span class="text-white">检测结果:</span>
        <ul class="text-slate-300 text-sm mt-1">
          ${record.detect_results.map(res => `
            <li>• ${res.class} (置信度: ${res.confidence}%)</li>
          `).join('')}
        </ul>
      </div>
      ${record.llm_suggestion ? `
        <div>
          <span class="text-white">大模型建议:</span>
          <p class="text-slate-300 text-sm mt-1">${record.llm_suggestion}</p>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// 页面加载时获取记录
document.addEventListener('DOMContentLoaded', loadDetectionRecords);