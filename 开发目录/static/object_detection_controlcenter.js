// Tab 切换逻辑
function switchTab(tabName) {
    // 隐藏所有面板
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    // 重置所有按钮样式
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active');
        el.classList.add('border-transparent');
    });
    // 显示目标面板
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    // 激活目标按钮
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

// ==============================================
// 所有页面交互逻辑（整合原HTML内的全部JS）
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    const addModelBtn = document.getElementById('addModelBtn');
    const modelDropdown = document.getElementById('modelDropdown');
    const modelList = document.querySelector('.space-y-4'); // 模型列表容器
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

    // ==============================================
    // 1. 新增模型 - 下拉菜单 + 自动添加到模型列表功能
    // ==============================================
    if(addModelBtn && modelDropdown) {
        // 点击按钮显示/隐藏下拉
        addModelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modelDropdown.classList.toggle('hidden');
        });

        // 点击外部关闭下拉
        document.addEventListener('click', () => {
            modelDropdown.classList.add('hidden');
        });

        // 点击菜单内部不关闭
        modelDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 选择模型 → 自动添加到列表（整合原逻辑+新增模型功能）
        options.forEach(option => {
            option.addEventListener('click', () => {
                const name = option.dataset.name;
                const desc = option.dataset.desc;
                const fps = option.dataset.fps;
                const prec = option.dataset.prec;

                modelDropdown.classList.add('hidden');

                // 新增模型到列表
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

                // 告警提示（使用统一的createAlert函数）
                createAlert('模型导入成功', `已成功导入模型「${name}」`, 'success');
            });
        });
    }

    // ==============================================
    // 2. 样本上传与预览功能（完整整合）
    // ==============================================
    if (sampleDropArea && fileInput) {
        // 点击区域 → 打开文件选择器（替换原提示逻辑）
        sampleDropArea.addEventListener('click', () => {
            fileInput.click();
        });

        // 选择文件后处理
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            handleFileUpload(file);
        });

        // 拖拽事件处理
        sampleDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            sampleDropArea.classList.add('border-cyan-400', 'bg-cyan-500/5');
        });
        sampleDropArea.addEventListener('dragleave', () => {
            sampleDropArea.classList.remove('border-cyan-400', 'bg-cyan-500/5');
        });
        sampleDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            sampleDropArea.classList.remove('border-cyan-400', 'bg-cyan-500/5');
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
        });

        // 处理文件上传与预览
        function handleFileUpload(file) {
            // 类型校验
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
            if (!allowedTypes.includes(file.type) && !file.name.endsWith('.bin')) {
                createAlert('文件格式不支持', '仅支持 JPG/PNG/MP4/BIN 格式文件', 'error');
                return;
            }

            // 显示预览（仅图片）
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    fileName.textContent = file.name;
                    previewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                // 视频/雷达文件只显示文件名
                previewContainer.classList.remove('hidden');
                previewImg.style.display = 'none';
                fileName.textContent = file.name;
            }

            // 告警提示
            createAlert('样本加载成功', `已加载文件：${file.name}，可开始推理`, 'success');
        }
    }

    // ==============================================
    // 3. 页面交互按钮事件（整合所有按钮逻辑）
    // ==============================================
    // 加载样本按钮 → 弹窗提示
    loadSampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sample = btn.dataset.sample;
            createAlert('样本加载', `已加载「${sample}」场景测试样本，可开始推理`, 'success');
        });
    });

    // 开始模拟推理按钮 → 弹窗提示（增加模拟推理完成逻辑）
    if (startInferenceBtn) {
        startInferenceBtn.addEventListener('click', () => {
            createAlert('推理启动', '正在加载模型并执行推理，请查看实时日志面板', 'success');
            // 模拟推理完成
            setTimeout(() => {
                createAlert('推理完成', '成功检测到 1 个目标，置信度 94.2%', 'success');
            }, 1500);
        });
    }

    // 视频流/摄像头 Tab → 开发中提示
    if (videoTabBtn) {
        videoTabBtn.addEventListener('click', () => {
            createAlert('功能开发中', '视频流推理功能正在开发，敬请期待', 'warning');
        });
    }
    if (cameraTabBtn) {
        cameraTabBtn.addEventListener('click', () => {
            createAlert('功能开发中', '摄像头实时推理功能正在开发，敬请期待', 'warning');
        });
    }
});