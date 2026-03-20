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
  // 5. 混淆矩阵
  // --------------------------
  const confusionMatrixCtx = document.getElementById('confusionMatrixChart').getContext('2d');
  const confusionMatrixChart = new Chart(confusionMatrixCtx, {
    type: 'matrix',
    data: {
      labels: ['人员', '车辆', '异常物体', '环境异常'],
      datasets: [{
        label: '混淆矩阵',
        data: [
          {x: 0, y: 0, v: 1240},
          {x: 0, y: 1, v: 8},
          {x: 0, y: 2, v: 7},
          {x: 0, y: 3, v: 3},
          {x: 1, y: 0, v: 12},
          {x: 1, y: 1, v: 872},
          {x: 1, y: 2, v: 9},
          {x: 1, y: 3, v: 3},
          {x: 2, y: 0, v: 15},
          {x: 2, y: 1, v: 11},
          {x: 2, y: 2, v: 416},
          {x: 2, y: 3, v: 10},
          {x: 3, y: 0, v: 9},
          {x: 3, y: 1, v: 7},
          {x: 3, y: 2, v: 13},
          {x: 3, y: 3, v: 606}
        ],
        backgroundColor: (context) => {
          const value = context.raw.v;
          const max = 1240;
          const alpha = value / max;
          return `rgba(6, 182, 212, ${alpha})`;
        },
        borderColor: 'rgba(30, 41, 59, 0.8)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (context) => `${context[0].raw.yLabel} → ${context[0].raw.xLabel}`,
            label: (context) => `样本数: ${context.raw.v}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: '预测类别', color: 'rgba(255, 255, 255, 0.7)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: '真实类别', color: 'rgba(255, 255, 255, 0.7)' },
          ticks: { color: 'rgba(255, 255, 255, 0.7)' },
          grid: { display: false }
        }
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
  // 初始3个默认模型数据（保留）
  // --------------------------
  const defaultModels = [
    {
      modelName: 'YOLOv8n 人员检测',
      version: 'v1.0.0',
      device: 'GPU-01',
      size: 6.2,
      inferTime: 18,
      accuracy: 95.2,
      env: 'Python 3.9 + Torch 2.1',
      uploadTime: '2026-03-20 14:30:00',
      status: 'loaded',
      loadTime: '2026-03-20 14:35:22'
    },
    {
      modelName: 'YOLOv8s 车辆识别',
      version: 'v2.1.1',
      device: 'GPU-02',
      size: 12.8,
      inferTime: 25,
      accuracy: 93.5,
      env: 'Python 3.9 + Torch 2.1',
      uploadTime: '2026-03-20 15:10:00',
      status: 'loaded',
      loadTime: '2026-03-20 15:12:45'
    },
    {
      modelName: 'YOLOv8m 异常检测',
      version: 'v1.5.2',
      device: 'CPU-01',
      size: 28.4,
      inferTime: 42,
      accuracy: 89.8,
      env: 'Python 3.9 + Torch 2.1',
      uploadTime: '2026-03-20 16:20:00',
      status: 'unloaded'
    }
  ];

  // --------------------------
  // 工具函数：更新模型状态到后端
  // --------------------------
  async function updateModelStatus(modelName, status) {
    try {
      await fetch(`http://localhost:5000/api/model/${encodeURIComponent(modelName)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      createAlert('状态同步失败', `模型「${modelName}」状态未同步到后端`, 'warning');
      console.error('更新状态失败:', err);
    }
  }

  // --------------------------
  // 生成模型卡片
  // --------------------------
  function createModelCard(modelData) {
    const { modelName, version, device, size, inferTime, accuracy, env, uploadTime, status } = modelData;
    const now = new Date();
    const loadTime = status === 'loaded'
      ? (modelData.loadTime || now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/\//g, '-'))
      : '-';

    const card = document.createElement('div');
    card.className = 'bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/50 transition-all';
    card.dataset.model = JSON.stringify(modelData);

    // 根据状态渲染不同样式
    if (status === 'loaded') {
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
    } else {
      card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
          <div>
            <h4 class="font-bold">${modelName}</h4>
            <p class="text-xs text-slate-400 mt-1">版本: ${version} | 大小: ${size}MB</p>
          </div>
          <span class="bg-slate-700 text-slate-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold">未加载</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs mb-3">
          <div><p class="text-slate-400">目标设备</p><p class="font-medium">${device}</p></div>
          <div><p class="text-slate-400">依赖环境</p><p class="font-medium">${env || 'Python 3.9 + Torch 2.1'}</p></div>
          <div><p class="text-slate-400">预估耗时</p><p class="font-medium">${inferTime}ms/帧</p></div>
          <div><p class="text-slate-400">预估精度</p><p class="font-medium">${accuracy}%</p></div>
        </div>
        <div class="flex gap-2">
          <button class="flex-1 bg-cyan-600/80 hover:bg-cyan-600 text-white p-2 rounded text-xs load-btn">加载模型</button>
          <button class="flex-1 bg-slate-700 hover:bg-slate-600 p-2 rounded text-xs detail-btn">查看详情</button>
        </div>
      `;
    }
    return card;
  }

  // --------------------------
  // 初始化：先渲染默认3个卡片，再加载后端模型
  // --------------------------
  async function initModelCards() {
    const container = document.getElementById('modelCardsContainer');

    // 1. 先渲染默认3个卡片（保留原有）
    defaultModels.forEach(model => {
      const card = createModelCard(model);
      container.appendChild(card);
    });

    // 2. 再从后端加载历史模型（追加，不覆盖）
    try {
      const res = await fetch('http://localhost:5000/api/model/list');
      const data = await res.json();

      if (data.code === 200 && data.data.length > 0) {
        // 过滤掉和默认模型重名的（避免重复）
        const backendModels = data.data.filter(model => {
          return !defaultModels.some(dm => dm.modelName === model.modelName);
        });

        backendModels.forEach(model => {
          const card = createModelCard(model);
          container.appendChild(card);
        });
      }
    } catch (err) {
      createAlert('加载失败', '无法获取后端模型列表，仅显示默认模型', 'warning');
      console.error('加载模型列表失败:', err);
    }
  }

  // --------------------------
  // 上传逻辑（调用后端接口）
  // --------------------------
  async function handleModalUpload() {
    const modelName = document.getElementById('modalModelName')?.value;
    const version = document.getElementById('modalVersion')?.value;
    const device = document.getElementById('modalDevice')?.value;
    const size = document.getElementById('modalSize')?.value;
    const inferTime = document.getElementById('modalInferTime')?.value;
    const accuracy = document.getElementById('modalAccuracy')?.value;
    const env = document.getElementById('modalEnv')?.value;
    const desc = document.getElementById('modalDesc')?.value;

    // 校验必填字段
    if (!modelName || !version || !device || !size || !inferTime || !accuracy || !env) {
      createAlert('上传失败', '请填写完整模型信息', 'error');
      return;
    }

    try {
      // 调用后端上传接口
      const res = await fetch('http://localhost:5000/api/model/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName, version, device, size, inferTime, accuracy, env, desc
        })
      });
      const data = await res.json();

      if (data.code === 200) {
        // 创建新卡片并追加到页面（不影响原有卡片）
        const newCard = createModelCard(data.data);
        const container = document.getElementById('modelCardsContainer');
        if (container) container.appendChild(newCard);

        createAlert('上传成功', `模型「${modelName}」已存储并部署到「${device}」`, 'success');
        closeModal();
        // 清空表单
        if (document.getElementById('modalUploadForm')) {
          document.getElementById('modalUploadForm').reset();
        }
      } else {
        createAlert('上传失败', data.msg, 'error');
      }
    } catch (err) {
      createAlert('网络错误', '无法连接到后端服务器，请检查服务是否启动', 'error');
      console.error('上传失败:', err);
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
    container.addEventListener('click', async function(e) {
      const target = e.target;
      const card = target.closest('.bg-slate-800\\/50');
      if (!card) return;

      const modelData = JSON.parse(card.dataset.model || '{}');
      const modelName = card.querySelector('h4').textContent;

      // 1. 卸载模型
      if (target.classList.contains('unload-btn')) {
        // 默认模型仅前端移除，后端模型同步状态
        const isDefaultModel = defaultModels.some(dm => dm.modelName === modelName);
        if (!isDefaultModel) {
          await updateModelStatus(modelName, 'unloaded');
        }
        card.remove();
        createAlert('卸载成功', `模型「${modelName}」已从设备上卸载`, 'success');
      }

      // 2. 重启模型
      if (target.classList.contains('restart-btn')) {
        // 默认模型仅前端切换，后端模型同步状态
        const isDefaultModel = defaultModels.some(dm => dm.modelName === modelName);
        if (!isDefaultModel) {
          await updateModelStatus(modelName, 'unloaded');
        }

        // 切换为未加载样式
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

      // 3. 加载模型
      if (target.classList.contains('load-btn')) {
        // 默认模型仅前端切换，后端模型同步状态
        const isDefaultModel = defaultModels.some(dm => dm.modelName === modelName);
        if (!isDefaultModel) {
          await updateModelStatus(modelName, 'loaded');
        }

        const now = new Date();
        const loadTime = now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(/\//g, '-');

        // 切换为已加载样式
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
                <div><p class="text-slate-400">上传时间</p><p class="font-medium">${modelData.uploadTime || '未知'}</p></div>
                <div><p class="text-slate-400">当前状态</p><p class="font-medium">${modelData.status === 'loaded' ? '已加载' : '未加载'}</p></div>
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

  // --------------------------
  // 导出报告函数
  // --------------------------
  function exportMetricsReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 标题
    doc.setFontSize(18);
    doc.text('模型训练指标分析报告', 14, 22);
    doc.setFontSize(12);
    doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 14, 32);

    // 总体指标
    doc.setFontSize(14);
    doc.text('总体指标', 14, 45);
    const overallMetrics = [
      ['指标', '数值'],
      ['精确率 (Precision)', '92.8%'],
      ['召回率 (Recall)', '91.5%'],
      ['F1 分数', '92.1%'],
      ['mAP@0.5', '90.3%'],
      ['推理速度', '18ms/帧'],
      ['参数量', '6.2M']
    ];
    doc.autoTable({
      head: [overallMetrics[0]],
      body: overallMetrics.slice(1),
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [6, 182, 212], textColor: 255 },
      bodyStyles: { fillColor: [30, 41, 59], textColor: 255 },
      alternateRowStyles: { fillColor: [15, 23, 42] }
    });

    // 类别级指标
    const lastY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('类别级指标详情', 14, lastY);
    const categoryMetrics = [
      ['目标类别', '精确率', '召回率', 'F1 分数', '样本数', '误检数'],
      ['人员', '95.2%', '94.8%', '95.0%', '1258', '18'],
      ['车辆', '93.5%', '92.1%', '92.8%', '896', '24'],
      ['异常物体', '88.7%', '87.9%', '88.3%', '452', '36'],
      ['环境异常', '89.2%', '88.5%', '88.8%', '635', '29']
    ];
    doc.autoTable({
      head: [categoryMetrics[0]],
      body: categoryMetrics.slice(1),
      startY: lastY + 5,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [6, 182, 212], textColor: 255 },
      bodyStyles: { fillColor: [30, 41, 59], textColor: 255 },
      alternateRowStyles: { fillColor: [15, 23, 42] }
    });

    // 保存 PDF
    doc.save(`模型训练指标报告_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // 绑定导出报告按钮
  const exportBtn = document.querySelector('button:has(span.iconify[data-icon="solar:download-bold"])');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportMetricsReport);
  }

  // 初始化模型卡片（先默认，后后端）
  initModelCards();

  // 初始化提示
  createAlert('模型管理系统就绪', '训练曲线模块已加载完成，默认3个模型已显示', 'success');
});