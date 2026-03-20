document.addEventListener('DOMContentLoaded', function() {
  // 子版块切换逻辑
  const tabs = document.querySelectorAll('.model-tab');
  const sections = document.querySelectorAll('.model-section');
  tabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active', 'bg-cyan-600/80', 'text-white'));
      sections.forEach(s => s.classList.add('hidden'));
      this.classList.add('active', 'bg-cyan-600/80', 'text-white');
      const targetId = this.getAttribute('href').substring(1);
      document.getElementById(targetId).classList.remove('hidden');
    });
  });

  // 生成每5轮的标签和数据点
  const generateLabelsAndData = (totalEpochs, step, generatorFunc) => {
    const labels = [];
    const data = [];
    for (let i = 0; i <= totalEpochs; i += step) {
      labels.push(i);
      data.push(generatorFunc(i));
    }
    return { labels, data };
  };

  // --------------------------
  // 1. 训练损失曲线（每5轮一个点）
  // --------------------------
  const trainLossData = {
    box: generateLabelsAndData(300, 5, i => 1.8 * Math.exp(-i/80) + 0.5),
    cls: generateLabelsAndData(300, 5, i => 1.2 * Math.exp(-i/60) + 0.3),
    dfl: generateLabelsAndData(300, 5, i => 1.0 * Math.exp(-i/100) + 0.6)
  };

  const trainLossCtx = document.getElementById('trainLossChart').getContext('2d');
  const trainLossChart = new Chart(trainLossCtx, {
    type: 'line',
    data: {
      labels: trainLossData.box.labels,
      datasets: [
        {
          label: 'Box Loss',
          data: trainLossData.box.data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Cls Loss',
          data: trainLossData.cls.data,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'DFL Loss',
          data: trainLossData.dfl.data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Loss', color: 'rgba(255, 255, 255, 0.7)' },
          beginAtZero: true,
          max: 1.8,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' }
        },
        x: {
          title: { display: true, text: 'Epoch', color: 'rgba(255, 255, 255, 0.7)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)', stepSize: 20 }
        }
      },
      plugins: {
        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
      }
    }
  });

  // --------------------------
  // 2. 验证损失曲线（每5轮一个点）
  // --------------------------
  const valLossData = {
    box: generateLabelsAndData(300, 5, i => 1.6 * Math.exp(-i/50) + 1.1),
    cls: generateLabelsAndData(300, 5, i => 1.3 * Math.exp(-i/40) + 0.8),
    dfl: generateLabelsAndData(300, 5, i => 1.0 * Math.exp(-i/60) + 0.7)
  };

  const valLossCtx = document.getElementById('valLossChart').getContext('2d');
  const valLossChart = new Chart(valLossCtx, {
    type: 'line',
    data: {
      labels: valLossData.box.labels,
      datasets: [
        {
          label: 'Val Box Loss',
          data: valLossData.box.data,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Val Cls Loss',
          data: valLossData.cls.data,
          borderColor: '#eab308',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Val DFL Loss',
          data: valLossData.dfl.data,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Loss', color: 'rgba(255, 255, 255, 0.7)' },
          beginAtZero: true,
          max: 1.6,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' }
        },
        x: {
          title: { display: true, text: 'Epoch', color: 'rgba(255, 255, 255, 0.7)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)', stepSize: 20 }
        }
      },
      plugins: {
        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
      }
    }
  });

  // --------------------------
  // 3. mAP 指标曲线（每5轮一个点）
  // --------------------------
  const mAPData = {
    mAP50: generateLabelsAndData(300, 5, i => 45 * (1 - Math.exp(-i/40))),
    mAP5095: generateLabelsAndData(300, 5, i => 25 * (1 - Math.exp(-i/50)))
  };

  const mAPCtx = document.getElementById('mAPChart').getContext('2d');
  const mAPChart = new Chart(mAPCtx, {
    type: 'line',
    data: {
      labels: mAPData.mAP50.labels,
      datasets: [
        {
          label: 'mAP@0.5',
          data: mAPData.mAP50.data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'mAP@0.5:0.95',
          data: mAPData.mAP5095.data,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'mAP (%)', color: 'rgba(255, 255, 255, 0.7)' },
          beginAtZero: true,
          max: 50,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' }
        },
        x: {
          title: { display: true, text: 'Epoch', color: 'rgba(255, 255, 255, 0.7)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)', stepSize: 20 }
        }
      },
      plugins: {
        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
      }
    }
  });

  // --------------------------
  // 4. 精确率 & 召回率曲线（每5轮一个点）
  // --------------------------
  const prData = {
    precision: generateLabelsAndData(300, 5, i => 50 * (1 - Math.exp(-i/30)) + 5),
    recall: generateLabelsAndData(300, 5, i => 35 * (1 - Math.exp(-i/35)) + 5)
  };

  const prCtx = document.getElementById('precisionRecallChart').getContext('2d');
  const precisionRecallChart = new Chart(prCtx, {
    type: 'line',
    data: {
      labels: prData.precision.labels,
      datasets: [
        {
          label: 'Precision',
          data: prData.precision.data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Recall',
          data: prData.recall.data,
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: '%', color: 'rgba(255, 255, 255, 0.7)' },
          beginAtZero: true,
          max: 65,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' }
        },
        x: {
          title: { display: true, text: 'Epoch', color: 'rgba(255, 255, 255, 0.7)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)', stepSize: 20 }
        }
      },
      plugins: {
        legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
      }
    }
  });

  // --------------------------
  // 弹窗控制逻辑
  // --------------------------
  const modalBackdrop = document.getElementById('uploadModalBackdrop');
  const modal = document.getElementById('uploadModal');
  const openModalBtn = document.getElementById('openUploadModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  function openModal() {
    modalBackdrop.classList.add('show');
    modal.classList.add('show');
  }

  function closeModal() {
    modalBackdrop.classList.remove('show');
    modal.classList.remove('show');
  }

  // 绑定弹窗事件
  if (openModalBtn) openModalBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  // --------------------------
  // 新增：动态创建模型卡片
  // --------------------------
  function createModelCard(modelData) {
    const { modelName, version, device, size, inferTime, accuracy, env } = modelData;
    const now = new Date();
    const loadTime = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-');

    const card = document.createElement('div');
    card.className = 'bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/50 transition-all';
    card.dataset.model = JSON.stringify(modelData); // 存储模型数据
    card.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <div>
          <h4 class="font-bold">${modelName}</h4>
          <p class="text-xs text-slate-400 mt-1">版本: ${version} | 大小: ${size}MB</p>
        </div>
        <span class="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">已加载</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs mb-3">
        <div><p class="text-slate-400">部署设备</p><p class="font-medium">${device}</p></div>
        <div><p class="text-slate-400">加载时间</p><p class="font-medium">${loadTime}</p></div>
        <div><p class="text-slate-400">推理耗时</p><p class="font-medium">${inferTime}ms/帧</p></div>
        <div><p class="text-slate-400">精度</p><p class="font-medium">${accuracy}%</p></div>
      </div>
      <div class="flex gap-2">
        <button class="flex-1 bg-slate-700 hover:bg-slate-600 p-2 rounded text-xs restart-btn">重启模型</button>
        <button class="flex-1 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded text-xs unload-btn">卸载</button>
      </div>
    `;
    return card;
  }

  // --------------------------
  // 上传逻辑（新增卡片）
  // --------------------------
  function handleModalUpload() {
    const modelName = document.getElementById('modalModelName')?.value;
    const version = document.getElementById('modalVersion')?.value;
    const device = document.getElementById('modalDevice')?.value;
    const file = document.getElementById('modalFile')?.files[0];
    const size = document.getElementById('modalSize')?.value;
    const inferTime = document.getElementById('modalInferTime')?.value;
    const accuracy = document.getElementById('modalAccuracy')?.value;
    const env = document.getElementById('modalEnv')?.value;

    if (!modelName || !version || !device || !file || !size || !inferTime || !accuracy || !env) {
      createAlert('上传失败', '请填写完整模型信息并选择模型文件', 'error');
      return;
    }

    // 1. 创建新卡片
    const modelData = { modelName, version, device, size, inferTime, accuracy, env };
    const newCard = createModelCard(modelData);

    // 2. 插入到卡片容器中
    const container = document.getElementById('modelCardsContainer');
    if (container) {
      container.appendChild(newCard);
    }

    createAlert('上传成功', `模型「${modelName}」已开始上传并部署到「${device}」`, 'success');
    closeModal();

    // 3. 清空表单
    if (document.getElementById('modalUploadForm')) {
      document.getElementById('modalUploadForm').reset();
    }
  }

  // 绑定上传按钮事件
  const modalUploadBtn = document.getElementById('modalUploadBtn');
  if (modalUploadBtn) {
    modalUploadBtn.addEventListener('click', handleModalUpload);
  }

  // --------------------------
  // 核心交互：卸载/重启/加载/查看详情
  // --------------------------
  const container = document.getElementById('modelCardsContainer');
  if (container) {
    container.addEventListener('click', function(e) {
      const target = e.target;
      // 使用语义化类名，避免特殊字符问题
      const card = target.closest('.bg-slate-800\\/50');
      if (!card) return;

      // 1. 卸载模型
      if (target.classList.contains('unload-btn')) {
        const modelName = card.querySelector('h4').textContent;
        card.remove();
        createAlert('卸载成功', `模型「${modelName}」已从设备上卸载`, 'success');
      }

      // 2. 重启模型 - 切换为未加载样式（图二）
      if (target.classList.contains('restart-btn')) {
        const modelName = card.querySelector('h4').textContent;
        const modelData = JSON.parse(card.dataset.model || '{}');

        // 替换为未加载样式
        card.innerHTML = `
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-bold">${modelName}</h4>
              <p class="text-xs text-slate-400 mt-1">版本: ${modelData.version} | 大小: ${modelData.size}MB</p>
            </div>
            <span class="bg-slate-700 text-slate-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">未加载</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs mb-3">
            <div><p class="text-slate-400">目标设备</p><p class="font-medium">${modelData.device}</p></div>
            <div><p class="text-slate-400">依赖环境</p><p class="font-medium">${modelData.env || 'Python 3.9 + Torch 2.1'}</p></div>
            <div><p class="text-slate-400">预估耗时</p><p class="font-medium">${modelData.inferTime}ms/帧</p></div>
            <div><p class="text-slate-400">预估精度</p><p class="font-medium">${modelData.accuracy}%</p></div>
          </div>
          <div class="flex gap-2">
            <button class="flex-1 bg-cyan-600/80 hover:bg-cyan-600 text-white p-2 rounded text-xs load-btn">加载模型</button>
            <button class="flex-1 bg-slate-700 hover:bg-slate-600 p-2 rounded text-xs detail-btn">查看详情</button>
          </div>
        `;
        createAlert('重启成功', `模型「${modelName}」正在重启，预计10秒后恢复服务`, 'success');
      }

      // 3. 加载模型 - 恢复为已加载样式
      if (target.classList.contains('load-btn')) {
        const modelName = card.querySelector('h4').textContent;
        const modelData = JSON.parse(card.dataset.model || '{}');
        const now = new Date();
        const loadTime = now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/\//g, '-');

        // 恢复为已加载样式
        card.innerHTML = `
          <div class="flex justify-between items-start mb-3">
            <div>
              <h4 class="font-bold">${modelName}</h4>
              <p class="text-xs text-slate-400 mt-1">版本: ${modelData.version} | 大小: ${modelData.size}MB</p>
            </div>
            <span class="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">已加载</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs mb-3">
            <div><p class="text-slate-400">部署设备</p><p class="font-medium">${modelData.device}</p></div>
            <div><p class="text-slate-400">加载时间</p><p class="font-medium">${loadTime}</p></div>
            <div><p class="text-slate-400">推理耗时</p><p class="font-medium">${modelData.inferTime}ms/帧</p></div>
            <div><p class="text-slate-400">精度</p><p class="font-medium">${modelData.accuracy}%</p></div>
          </div>
          <div class="flex gap-2">
            <button class="flex-1 bg-slate-700 hover:bg-slate-600 p-2 rounded text-xs restart-btn">重启模型</button>
            <button class="flex-1 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded text-xs unload-btn">卸载</button>
          </div>
        `;
        createAlert('加载成功', `模型「${modelName}」已成功加载到「${modelData.device}」`, 'success');
      }

      // 4. 查看详情
      if (target.classList.contains('detail-btn')) {
        const modelData = JSON.parse(card.dataset.model || '{}');
        const detailModal = document.createElement('div');
        detailModal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
        detailModal.innerHTML = `
          <div class="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-white">模型详情</h3>
              <button class="text-slate-400 hover:text-white close-detail"><span class="iconify text-xl" data-icon="solar:close-bold"></span></button>
            </div>
            <div class="space-y-3 text-sm">
              <div class="grid grid-cols-2 gap-2">
                <div><p class="text-slate-400">模型名称</p><p class="font-medium">${modelData.modelName}</p></div>
                <div><p class="text-slate-400">版本号</p><p class="font-medium">${modelData.version}</p></div>
                <div><p class="text-slate-400">部署设备</p><p class="font-medium">${modelData.device}</p></div>
                <div><p class="text-slate-400">模型大小</p><p class="font-medium">${modelData.size}MB</p></div>
                <div><p class="text-slate-400">推理耗时</p><p class="font-medium">${modelData.inferTime}ms/帧</p></div>
                <div><p class="text-slate-400">模型精度</p><p class="font-medium">${modelData.accuracy}%</p></div>
                <div><p class="text-slate-400">工作环境</p><p class="font-medium">${modelData.env || 'Python 3.9 + Torch 2.1'}</p></div>
              </div>
              <div>
                <p class="text-slate-400">模型描述</p>
                <p class="font-medium mt-1 text-slate-300">${modelData.desc || '无描述信息'}</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(detailModal);
        detailModal.querySelector('.close-detail').addEventListener('click', () => detailModal.remove());
        detailModal.addEventListener('click', (e) => e.target === detailModal && detailModal.remove());
      }
    });
  }

  // --------------------------
  // 告警函数
  // --------------------------
  function createAlert(title, content, type = 'error') {
    const alertItem = document.createElement('div');
    alertItem.className = 'alert-item';
    if (type === 'warning') alertItem.style.borderLeftColor = '#eab308';
    if (type === 'success') alertItem.style.borderLeftColor = '#22c55e';
    if (type === 'error') alertItem.style.borderLeftColor = '#ef4444';

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

  // 初始化提示
  createAlert('模型管理系统就绪', '训练曲线模块已加载完成，图表已调整为每5轮显示一个散点', 'success');
});