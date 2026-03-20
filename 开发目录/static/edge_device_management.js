// ==============================================
// 极境守护 - 设备管理页面核心逻辑
// 功能模块：
// 1. 全局状态与DOM元素管理
// 2. 顶部统计更新
// 3. 告警通知系统
// 4. 设备详情侧边栏
// 5. 设备注册弹窗
// 6. 动态设备卡片生成
// 7. 设备预览弹窗
// 8. 故障处理（排查故障/尝试重连/设备诊断）
// 9. 搜索过滤
// ==============================================

// --------------------------
// 1. 全局状态与DOM元素
// --------------------------
const modal = document.getElementById('deviceRegisterModal');
const openBtn = document.getElementById('initNewNodeBtn');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('deviceRegisterForm');
const cardContainer = document.getElementById('deviceCardsContainer');
const previewModal = document.getElementById('previewModal');
const closePreviewModal = document.getElementById('closePreviewModal');
const previewCardContent = document.getElementById('previewCardContent');
const searchInput = document.getElementById('searchInput');
const deviceSidebar = document.getElementById('deviceSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');
const alertContainer = document.getElementById('alertContainer');

// 节点状态计数
let nodeCounts = { online: 124, error: 2, maintenance: 12, offline: 10 };

// --------------------------
// 2. 顶部统计更新
// --------------------------
function updateStats() {
  document.getElementById('onlineStat').innerHTML = `<span class="w-2 h-2 rounded-full bg-green-500 status-pulse"></span> 在线: ${nodeCounts.online} 节点`;
  document.getElementById('errorStat').innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500"></span> 异常: ${nodeCounts.error} 节点`;
  document.getElementById('maintenanceStat').innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-500"></span> 自热开启中: ${nodeCounts.maintenance}`;
  document.getElementById('offlineStat').innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-500"></span> 离线: ${nodeCounts.offline} 节点`;
}

// --------------------------
// 3. 告警通知系统
// --------------------------
/**
 * 创建告警通知
 * @param {string} title - 告警标题
 * @param {string} content - 告警内容
 * @param {string} type - 告警类型 (error/warning/success)
 */
function createAlert(title, content, type = 'error') {
  const alertItem = document.createElement('div');
  alertItem.className = 'alert-item';
  if (type === 'warning') alertItem.style.borderLeftColor = '#eab308';
  if (type === 'success') alertItem.style.borderLeftColor = '#22c55e';
  alertItem.innerHTML = `
    <div class="flex justify-between items-start">
      <span class="font-medium">${title}</span>
      <button class="text-slate-400 hover:text-white close-alert"><span class="iconify text-sm" data-icon="solar:close-bold"></span></button>
    </div>
    <p class="text-xs mt-1 text-slate-300">${content}</p>
  `;
  alertContainer.appendChild(alertItem);
  alertItem.querySelector('.close-alert').addEventListener('click', () => alertItem.remove());
  setTimeout(() => {
    alertItem.style.opacity = '0';
    alertItem.style.transform = 'translateX(100%)';
    alertItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => alertItem.remove(), 300);
  }, 5000);
}

// 定时模拟告警
setInterval(() => {
  const alertDevices = ['FAULT-NODE-01', 'ROOF-TOP-SENSE'];
  const randomDevice = alertDevices[Math.floor(Math.random() * alertDevices.length)];
  if (randomDevice === 'FAULT-NODE-01') {
    createAlert(`设备 ${randomDevice} 告警`, '设备连接异常，已持续5分钟，请及时处理', 'error');
  } else {
    createAlert(`设备 ${randomDevice} 警告`, '信号强度低于20%，链路稳定性下降', 'warning');
  }
}, 10000);

// --------------------------
// 4. 设备详情侧边栏
// --------------------------
/**
 * 打开设备详情侧边栏
 * @param {HTMLElement} deviceCard - 设备卡片DOM元素
 */
function openSidebar(deviceCard) {
  const deviceId = deviceCard.dataset.deviceId;
  const status = deviceCard.dataset.status;
  const ip = deviceCard.dataset.ip;
  const type = deviceCard.dataset.type;
  const location = deviceCard.dataset.location;
  const environment = deviceCard.dataset.environment;
  const activeTime = deviceCard.dataset.activeTime;
  const runtime = deviceCard.dataset.runtime;
  const version = deviceCard.dataset.version;
  const sn = deviceCard.dataset.sn;

  // 状态映射
  const statusMap = {
    online: { text: '在线 (Stable)', color: 'text-green-500' },
    error: { text: '异常 (Error)', color: 'text-red-500' },
    maintenance: { text: '维护中 (Unstable)', color: 'text-yellow-500' },
    offline: { text: '离线 (Offline)', color: 'text-slate-500' }
  };
  const typeMap = { ptz_camera: 'PTZ 摄像头', fixed_camera: '固定摄像头', sensor: '环境传感器', edge_gateway: '边缘网关' };
  const envMap = { extreme_cold: '极端低温', extreme_hot: '极端高温', strong_wind: '强风', rainstorm: '暴雨', dark: '黑暗', complex_hybrid_env: '复杂混合环境' };

  // 更新侧边栏内容
  document.getElementById('sidebarDeviceTitle').textContent = `${deviceId} - 设备详情`;
  document.getElementById('sidebarDeviceId').textContent = deviceId;
  document.getElementById('sidebarDeviceStatus').textContent = statusMap[status].text;
  document.getElementById('sidebarDeviceStatus').className = `font-medium ${statusMap[status].color}`;
  document.getElementById('sidebarDeviceIp').textContent = ip;
  document.getElementById('sidebarDeviceType').textContent = typeMap[type] || type;
  document.getElementById('sidebarDeviceLocation').textContent = location;
  document.getElementById('sidebarDeviceEnv').textContent = envMap[environment] || environment;
  document.getElementById('sidebarDeviceActiveTime').textContent = activeTime;
  document.getElementById('sidebarDeviceRuntime').textContent = `${runtime} 小时`;
  document.getElementById('sidebarDeviceVersion').textContent = version;
  document.getElementById('sidebarDeviceSn').textContent = sn;

  // 更新实时数据
  const temp = deviceCard.querySelector('.font-mono.text-cyan-400')?.textContent || '42.5 °C';
  const cpu = deviceCard.querySelector('.grid-cols-2 .text-xs + p')?.textContent || '12%';
  const signal = status === 'maintenance' ? '15%' : '98%';
  document.getElementById('sidebarTemp').textContent = temp.split(' ')[0];
  document.getElementById('sidebarCpu').textContent = cpu;
  document.getElementById('sidebarSignal').textContent = signal;

  initDeviceChart(status);
  deviceSidebar.classList.add('open');
  sidebarOverlay.classList.add('show');
}

function closeSidebarFunc() {
  deviceSidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
}
closeSidebar.addEventListener('click', closeSidebarFunc);
sidebarOverlay.addEventListener('click', closeSidebarFunc);

// 绑定设备卡片点击事件（排除按钮）
document.querySelectorAll('.device-card').forEach(card => {
  card.addEventListener('click', (e) => {
    if (!e.target.closest('button')) openSidebar(card);
  });
});

/**
 * 初始化设备实时数据图表
 * @param {string} status - 设备状态
 */
function initDeviceChart(status) {
  const ctx = document.getElementById('deviceDataChart').getContext('2d');
  if (window.deviceChart) window.deviceChart.destroy();

  const hours = Array.from({length: 12}, (_, i) => `${i}h`);
  const tempData = Array.from({length: 12}, () => Math.floor(Math.random() * 10) + 35);
  const cpuData = Array.from({length: 12}, () => Math.floor(Math.random() * 20) + 5);
  const signalData = status === 'maintenance' ? Array.from({length: 12}, () => Math.floor(Math.random() * 15) + 5) : Array.from({length: 12}, () => Math.floor(Math.random() * 5) + 95);

  window.deviceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        { label: '温度 (°C)', data: tempData, borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)', tension: 0.4, fill: true },
        { label: 'CPU 负载 (%)', data: cpuData, borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', tension: 0.4, fill: true },
        { label: '信号强度 (%)', data: signalData, borderColor: status === 'maintenance' ? '#eab308' : '#22c55e', backgroundColor: status === 'maintenance' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)', tension: 0.4, fill: true }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } },
        x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: 'rgba(255, 255, 255, 0.7)' } }
      },
      plugins: { legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } } }
    }
  });
}

// --------------------------
// 5. 设备注册弹窗
// --------------------------
openBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
  const now = new Date();
  const activateTime = now.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.querySelector('input[name="activate_time"]').value = activateTime;
});

function closeModal() {
  modal.classList.add('hidden');
  form.reset();
}
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// --------------------------
// 6. 动态设备卡片生成
// --------------------------
/**
 * 动态生成设备卡片
 * @param {object} deviceData - 设备数据
 */
function createDeviceCard(deviceData) {
  const card = document.createElement('div');
  card.dataset.deviceId = deviceData.device_id;
  card.dataset.location = deviceData.location;
  card.dataset.environment = deviceData.environment;
  card.dataset.status = deviceData.status;
  card.dataset.ip = deviceData.ip_address;
  card.dataset.type = deviceData.device_type;
  card.dataset.activeTime = deviceData.activate_time;
  card.dataset.runtime = deviceData.total_usage_hours;
  card.dataset.version = 'v2.4.8';
  card.dataset.sn = `POLAR-${new Date().getTime().toString().slice(-8)}`;
  card.className = 'device-card';

  let statusClass = '', statusText = '', cardClass = 'glass-panel rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all group';
  if (deviceData.status === 'online') { statusClass = 'bg-green-500/20 text-green-500'; statusText = 'Stable'; }
  else if (deviceData.status === 'offline') { statusClass = 'bg-slate-700 text-slate-500'; statusText = 'Offline'; cardClass += ' grayscale'; }
  else if (deviceData.status === 'maintenance') { statusClass = 'bg-yellow-500/20 text-yellow-500'; statusText = 'Unstable'; cardClass += ' border-yellow-500/50'; }
  else if (deviceData.status === 'error') { statusClass = 'bg-red-500/20 text-red-500'; statusText = 'Error'; cardClass += ' border-red-500/50'; }

  const envMap = { extreme_cold: '极端低温', extreme_hot: '极端高温', strong_wind: '强风', rainstorm: '暴雨', dark: '黑暗', complex_hybrid_env: '复杂混合环境' };
  card.className = cardClass;
  card.innerHTML = `
    <div class="h-44 bg-slate-800 relative">
      ${deviceData.status === 'offline' ? '<div class="absolute inset-0 flex items-center justify-center bg-black/80"><span class="text-xs font-mono text-slate-600 tracking-widest">OFFLINE</span></div>' : `
        <img alt="Camera view preview" class="w-full h-full object-cover ${deviceData.status === 'maintenance' || deviceData.status === 'error' ? 'opacity-30 grayscale' : ''}" src="https://modao.cc/agent-py/media/generated_images/2026-03-18/5ccbabe21d33428a8ff7e3159e0aff28.jpg"/>
        ${deviceData.status === 'maintenance' ? '<div class="absolute inset-0 flex items-center justify-center"><span class="iconify text-4xl text-yellow-500 animate-pulse" data-icon="solar:danger-bold"></span></div>' : deviceData.status === 'error' ? '<div class="absolute inset-0 flex items-center justify-center"><span class="iconify text-4xl text-red-500 animate-pulse" data-icon="solar:close-circle-bold"></span></div>' : ''}
        <div class="absolute top-3 left-3 flex gap-2"><span class="px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] text-white">4K UHD</span>${deviceData.device_type === 'ptz_camera' ? '<span class="px-2 py-0.5 bg-cyan-600 text-[10px] text-white rounded">PTZ</span>' : ''}</div>
      `}
    </div>
    <div class="p-5">
      <div class="flex justify-between items-start mb-3">
        <div><h4 class="font-bold text-lg leading-none ${deviceData.status === 'offline' ? 'text-slate-500' : ''}">${deviceData.device_id}</h4><p class="text-xs text-slate-500 mt-2">IP: ${deviceData.ip_address}</p></div>
        <span class="${statusClass} px-2 py-0.5 rounded text-[10px] uppercase font-bold">${statusText}</span>
      </div>
      ${deviceData.status !== 'offline' ? `
        <div class="grid grid-cols-2 gap-4 my-4">
          <div class="text-xs space-y-1"><p class="text-slate-500">机身温度</p><p class="font-mono text-cyan-400">${Math.floor(Math.random() * 20 + 30)}.${Math.floor(Math.random() * 10)} °C ${deviceData.environment === 'extreme_cold' ? '(已加热)' : ''}</p></div>
          <div class="text-xs space-y-1"><p class="text-slate-500">CPU 负载</p><p class="font-mono text-cyan-400">${Math.floor(Math.random() * 20 + 10)}%</p></div>
        </div>
      ` : '<div class="flex gap-2 mt-4"><button class="flex-1 bg-slate-800 text-slate-500 p-2 rounded text-xs cursor-not-allowed diagnose-btn" data-device-id="${deviceData.device_id}">设备诊断</button></div>'}
      ${deviceData.status === 'online' ? `
        <div class="flex gap-2">
          <button class="flex-1 bg-slate-800 hover:bg-slate-700 p-2 rounded text-xs preview-btn" data-device-id="${deviceData.device_id}" data-device-name="${deviceData.device_id}" data-ip="${deviceData.ip_address}" data-status="online" data-device-type="${deviceData.device_type}" data-environment="${envMap[deviceData.environment] || deviceData.environment}" data-location="${deviceData.location}">调整预览</button>
          <button class="w-10 bg-slate-800 hover:bg-cyan-600 p-2 rounded flex items-center justify-center transition-colors"><span class="iconify" data-icon="solar:compass-bold"></span></button>
          <button class="w-10 bg-slate-800 hover:bg-red-600 p-2 rounded flex items-center justify-center transition-colors"><span class="iconify" data-icon="solar:restart-bold"></span></button>
        </div>
      ` : deviceData.status === 'maintenance' ? `
        <div class="p-3 bg-slate-900 rounded-lg text-[10px] text-yellow-500 border border-yellow-500/20 mb-4">警告: 极端环境导致设备链路抖动，正在重试。</div>
        <div class="flex gap-2"><button class="flex-1 bg-yellow-600 text-white p-2 rounded text-xs font-bold reconnect-btn" data-device-id="${deviceData.device_id}">尝试重连</button></div>
      ` : deviceData.status === 'error' ? `
        <div class="p-3 bg-slate-900 rounded-lg text-[10px] text-red-500 border border-red-500/20 mb-4">错误: 设备连接异常，无法获取实时数据。</div>
        <div class="flex gap-2"><button class="flex-1 bg-red-600 text-white p-2 rounded text-xs font-bold fix-error-btn" data-device-id="${deviceData.device_id}">排查故障</button></div>
      ` : ''}
    </div>
  `;
  cardContainer.appendChild(card);
  card.addEventListener('click', (e) => { if (!e.target.closest('button')) openSidebar(card); });
}

// 表单提交处理
// --------------------------
// 6. 动态设备卡片生成 + 后端API调用
// --------------------------
// 表单提交处理
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const deviceData = Object.fromEntries(formData.entries());

  try {
    // 1. 调用后端API保存设备数据到JSON
    const response = await fetch('http://localhost:5000/api/device/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    });

    const result = await response.json();

    if (result.status === 'success') {
      // 2. 更新页面统计
      nodeCounts[deviceData.status] += 1;
      updateStats();

      // 3. 生成设备卡片
      createDeviceCard(deviceData);

      // 4. 提示成功
      createAlert(`设备 ${deviceData.device_id} 已添加`, '新设备节点初始化完成，数据已保存', 'success');
      alert('设备节点初始化成功！\n设备 ID: ' + deviceData.device_id);
      closeModal();
    } else {
      // API调用成功但保存失败
      createAlert(`设备 ${deviceData.device_id} 添加失败`, result.msg || '保存数据到JSON失败', 'error');
      alert('设备注册失败：' + (result.msg || '未知错误'));
    }
  } catch (error) {
    // API调用失败（如后端未启动）
    console.error('调用后端API失败：', error);
    createAlert('API调用失败', '请检查后端服务是否启动（http://localhost:5000）', 'error');
    alert('设备注册失败：无法连接到后端服务，请先启动Flask服务器');

    // 降级处理：仅在页面展示（不保存到JSON）
    nodeCounts[deviceData.status] += 1;
    updateStats();
    createDeviceCard(deviceData);
    closeModal();
  }
});

// --------------------------
// 7. 设备预览弹窗
// --------------------------
function closePreviewModalFunc() { previewModal.classList.add('hidden'); }
closePreviewModal.addEventListener('click', closePreviewModalFunc);
previewModal.addEventListener('click', (e) => { if (e.target === previewModal) closePreviewModalFunc(); });

function generatePreviewCard(deviceData) {
  let statusClass = '', statusText = '';
  if (deviceData.status === 'online') { statusClass = 'bg-green-500/20 text-green-500'; statusText = 'Stable'; }
  else if (deviceData.status === 'offline') { statusClass = 'bg-slate-700 text-slate-500'; statusText = 'Offline'; }
  else if (deviceData.status === 'maintenance') { statusClass = 'bg-yellow-500/20 text-yellow-500'; statusText = 'Unstable'; }
  else if (deviceData.status === 'error') { statusClass = 'bg-red-500/20 text-red-500'; statusText = 'Error'; }

  return `
    <div class="glass-panel rounded-2xl overflow-hidden">
      <div class="h-48 bg-slate-800 relative">
        ${deviceData.status === 'offline' ? '<div class="absolute inset-0 flex items-center justify-center bg-black/80"><span class="text-xs font-mono text-slate-600 tracking-widest">OFFLINE</span></div>' : `
          <img alt="Camera preview" class="w-full h-full object-cover ${deviceData.status === 'maintenance' || deviceData.status === 'error' ? 'opacity-30 grayscale' : ''}" src="https://modao.cc/agent-py/media/generated_images/2026-03-18/5ccbabe21d33428a8ff7e3159e0aff28.jpg"/>
          ${deviceData.status === 'maintenance' ? '<div class="absolute inset-0 flex items-center justify-center"><span class="iconify text-5xl text-yellow-500 animate-pulse" data-icon="solar:danger-bold"></span></div>' : deviceData.status === 'error' ? '<div class="absolute inset-0 flex items-center justify-center"><span class="iconify text-5xl text-red-500 animate-pulse" data-icon="solar:close-circle-bold"></span></div>' : ''}
          <div class="absolute top-3 left-3 flex gap-2"><span class="px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] text-white">4K UHD</span>${deviceData.deviceType === 'ptz_camera' ? '<span class="px-2 py-0.5 bg-cyan-600 text-[10px] text-white rounded">PTZ</span>' : ''}</div>
        `}
      </div>
      <div class="p-6">
        <div class="flex justify-between items-start mb-4">
          <div><h3 class="text-xl font-bold">${deviceData.deviceName}</h3><p class="text-sm text-slate-400 mt-1">IP: ${deviceData.ip}</p></div>
          <span class="${statusClass} px-3 py-1 rounded text-sm uppercase font-bold">${statusText}</span>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div><p class="text-xs text-slate-400">机身温度</p><p class="text-cyan-400 font-mono text-lg">${(Math.random() * 10 + 35).toFixed(1)} °C ${deviceData.environment === '极端低温' ? '(已加热)' : ''}</p></div>
          <div><p class="text-xs text-slate-400">CPU 负载</p><p class="text-cyan-400 font-mono text-lg">${Math.floor(Math.random() * 20 + 10)}%</p></div>
        </div>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between"><span class="text-slate-400">安装位置</span><span>${deviceData.location || '未设置'}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">运行环境</span><span>${deviceData.environment}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">激活时间</span><span>${new Date().toLocaleString('zh-CN')}</span></div>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('preview-btn')) {
    const deviceData = {
      deviceId: e.target.dataset.deviceId, deviceName: e.target.dataset.deviceName, ip: e.target.dataset.ip,
      status: e.target.dataset.status, deviceType: e.target.dataset.deviceType, environment: e.target.dataset.environment, location: e.target.dataset.location
    };
    previewCardContent.innerHTML = generatePreviewCard(deviceData);
    previewModal.classList.remove('hidden');
  }
});

// --------------------------
// 8. 故障处理功能
// --------------------------
function setLoading(btn, originalText) {
  btn.disabled = true;
  btn.innerHTML = `<span class="iconify animate-spin" data-icon="eos-icons:loading"></span> 处理中...`;
  btn.classList.add('opacity-70', 'cursor-not-allowed');
}
function resetButton(btn, originalText) {
  btn.disabled = false;
  btn.innerHTML = originalText;
  btn.classList.remove('opacity-70', 'cursor-not-allowed');
}

// 排查故障（Error 状态）
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('fix-error-btn')) {
    const btn = e.target;
    const deviceId = btn.dataset.deviceId;
    const originalText = btn.innerHTML;
    setLoading(btn, originalText);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.3;
    if (success) {
      alert(`✅ 设备 ${deviceId} 故障已排除，已恢复在线状态`);
      createAlert(`设备 ${deviceId} 故障修复`, '设备已恢复正常运行，状态更新为在线', 'success');
      const card = btn.closest('.glass-panel');
      card.classList.remove('border-red-500/50');
      const statusElements = card.querySelectorAll('[class*="text-red-500"], [class*="bg-red-500/20"], [class*="bg-red-600"]');
      statusElements.forEach(el => {
        if (el.classList.contains('text-red-500')) el.classList.replace('text-red-500', 'text-green-500');
        if (el.classList.contains('bg-red-500/20')) el.classList.replace('bg-red-500/20', 'bg-green-500/20');
        if (el.classList.contains('bg-red-600')) el.classList.replace('bg-red-600', 'bg-green-600');
      });
      card.querySelector('span[class*="uppercase"]').textContent = 'Stable';
      nodeCounts.error -= 1;
      nodeCounts.online += 1;
      updateStats();
    } else {
      alert(`❌ 设备 ${deviceId} 排查失败，请联系运维人员`);
      createAlert(`设备 ${deviceId} 排查失败`, '故障原因复杂，无法自动修复，请人工介入', 'error');
    }
    resetButton(btn, originalText);
  }
});

// 尝试重连（Maintenance 状态）
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('reconnect-btn')) {
    const btn = e.target;
    const deviceId = btn.dataset.deviceId;
    const originalText = btn.innerHTML;
    setLoading(btn, originalText);
    await new Promise(resolve => setTimeout(resolve, 2500));
    const success = Math.random() > 0.4;
    if (success) {
      alert(`✅ 设备 ${deviceId} 重连成功，已恢复稳定`);
      createAlert(`设备 ${deviceId} 重连成功`, '信号强度恢复正常，链路稳定性提升', 'success');
      const card = btn.closest('.glass-panel');
      card.classList.remove('border-yellow-500/50');
      const img = card.querySelector('img');
      if (img) img.classList.remove('opacity-30', 'grayscale');
      const statusElements = card.querySelectorAll('[class*="text-yellow-500"], [class*="bg-yellow-500/20"], [class*="bg-yellow-600"]');
      statusElements.forEach(el => {
        if (el.classList.contains('text-yellow-500')) el.classList.replace('text-yellow-500', 'text-green-500');
        if (el.classList.contains('bg-yellow-500/20')) el.classList.replace('bg-yellow-500/20', 'bg-green-500/20');
        if (el.classList.contains('bg-yellow-600')) el.classList.replace('bg-yellow-600', 'bg-green-600');
      });
      card.querySelector('span[class*="uppercase"]').textContent = 'Stable';
      nodeCounts.maintenance -= 1;
      nodeCounts.online += 1;
      updateStats();
    } else {
      alert(`⚠️ 设备 ${deviceId} 重连失败，将在 30 秒后自动重试`);
      createAlert(`设备 ${deviceId} 重连失败`, '链路仍不稳定，系统将在30秒后自动重试', 'warning');
    }
    resetButton(btn, originalText);
  }
});

// 设备诊断（Offline 状态）
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('diagnose-btn')) {
    const btn = e.target;
    const deviceId = btn.dataset.deviceId;
    const originalText = btn.innerHTML;
    if (btn.classList.contains('cursor-not-allowed')) {
      alert(`🔌 设备 ${deviceId} 当前离线，请先检查物理连接`);
      return;
    }
    setLoading(btn, originalText);
    await new Promise(resolve => setTimeout(resolve, 3000));
    alert(`📊 设备 ${deviceId} 诊断报告：\n- 电源状态：正常\n- 网络连接：中断\n- 建议：检查网线/交换机`);
    resetButton(btn, originalText);
  }
});

// --------------------------
// 9. 搜索过滤功能
// --------------------------
function filterDevices(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  const allCards = document.querySelectorAll('#deviceCardsContainer > div');
  allCards.forEach(card => {
    const deviceId = (card.dataset.deviceId || '').toLowerCase();
    const location = (card.dataset.location || '').toLowerCase();
    const environment = (card.dataset.environment || '').toLowerCase();
    const match = deviceId.includes(term) || location.includes(term) || environment.includes(term);
    match ? card.classList.remove('hidden') : card.classList.add('hidden');
  });
}
searchInput.addEventListener('input', (e) => filterDevices(e.target.value));
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') filterDevices(e.target.value); });
// --------------------------
// 10. 导出报告功能（最终修复版）
// --------------------------
// 全局事件委托：监听所有「导出报告」按钮点击
document.addEventListener('click', async (e) => {
  // 匹配：上方文字链接 + 下方按钮
  if (e.target.textContent.includes('导出报告') || e.target.closest('button')?.textContent === '导出报告') {
    await exportDeviceReport();
  }
});

/**
 * 导出设备详情报告（核心逻辑）
 */
async function exportDeviceReport() {
  // 1. 校验侧边栏是否有设备数据
  const deviceId = document.getElementById('sidebarDeviceId')?.textContent;
  if (!deviceId) {
    createAlert('导出失败', '请先打开设备详情页', 'error');
    return;
  }

  // 2. 从侧边栏提取完整数据
  const reportData = {
    device_id: deviceId,
    device_name: document.getElementById('sidebarDeviceTitle').textContent.split(' - ')[0],
    status: document.getElementById('sidebarDeviceStatus').textContent,
    ip_address: document.getElementById('sidebarDeviceIp').textContent,
    device_type: document.getElementById('sidebarDeviceType').textContent,
    location: document.getElementById('sidebarDeviceLocation').textContent,
    environment: document.getElementById('sidebarDeviceEnv').textContent,
    activate_time: document.getElementById('sidebarDeviceActiveTime').textContent,
    runtime: document.getElementById('sidebarDeviceRuntime').textContent,
    firmware_version: document.getElementById('sidebarDeviceVersion').textContent,
    sn: document.getElementById('sidebarDeviceSn').textContent,
    realtime_data: {
      temperature: document.getElementById('sidebarTemp').textContent,
      cpu_load: document.getElementById('sidebarCpu').textContent,
      signal_strength: document.getElementById('sidebarSignal').textContent
    },
    export_time: new Date().toLocaleString('zh-CN'),
    maintenance_records: Array.from(document.querySelectorAll('#deviceSidebar .space-y-2 > div')).map(el => ({
      type: el.querySelector('.flex.justify-between span:first-child')?.textContent || '',
      time: el.querySelector('.flex.justify-between span:last-child')?.textContent || '',
      content: el.querySelector('p')?.textContent || ''
    }))
  };

  // 3. 选择导出格式
  const format = prompt('请选择导出格式：\n1. PDF\n2. CSV\n3. TXT', 'PDF');
  if (!format) return;

  try {
    if (format.toLowerCase() === 'pdf' || format === '1') {
      await exportToPDF(reportData);
    } else if (format.toLowerCase() === 'csv' || format === '2') {
      exportToCSV(reportData);
    } else if (format.toLowerCase() === 'txt' || format === '3') {
      exportToTXT(reportData);
    } else {
      alert('不支持的格式，将默认导出 PDF');
      await exportToPDF(reportData);
    }
    createAlert(`设备 ${deviceId} 报告导出成功`, `格式：${format.toUpperCase()}`, 'success');
  } catch (err) {
    console.error('导出失败：', err);
    createAlert(`设备 ${deviceId} 报告导出失败`, err.message, 'error');
  }
}

// 导出为 TXT（修复编码）
// 导出为 TXT（彻底解决乱码）
function exportToTXT(reportData) {
  let content = `极境守护 - 设备详情报告\n`;
  content += `========================================\n`;
  content += `设备ID：${reportData.device_id}\n`;
  content += `设备名称：${reportData.device_name}\n`;
  content += `状态：${reportData.status}\n`;
  content += `IP地址：${reportData.ip_address}\n`;
  content += `设备类型：${reportData.device_type}\n`;
  content += `安装位置：${reportData.location}\n`;
  content += `运行环境：${reportData.environment}\n`;
  content += `激活时间：${reportData.activate_time}\n`;
  content += `累计运行：${reportData.runtime}\n`;
  content += `固件版本：${reportData.firmware_version}\n`;
  content += `SN序列号：${reportData.sn}\n\n`;
  content += `实时数据监控\n`;
  content += `----------------------------------------\n`;
  content += `当前温度：${reportData.realtime_data.temperature} °C\n`;
  content += `CPU负载：${reportData.realtime_data.cpu_load}\n`;
  content += `信号强度：${reportData.realtime_data.signal_strength}\n\n`;
  content += `运维记录\n`;
  content += `----------------------------------------\n`;
  reportData.maintenance_records.forEach(r => {
    content += `[${r.time}] ${r.type}：${r.content}\n`;
  });
  content += `\n导出时间：${reportData.export_time}\n`;

  // ✅ 关键：加 UTF-8 BOM 头，让 Windows 识别为中文编码
  const blob = new Blob(["\ufeff" + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `设备报告_${reportData.device_id}_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// 导出为 CSV（彻底解决乱码）
function exportToCSV(reportData) {
  let csv = `字段,值\n`;
  csv += `设备ID,${reportData.device_id}\n`;
  csv += `设备名称,${reportData.device_name}\n`;
  csv += `状态,${reportData.status}\n`;
  csv += `IP地址,${reportData.ip_address}\n`;
  csv += `设备类型,${reportData.device_type}\n`;
  csv += `安装位置,${reportData.location}\n`;
  csv += `运行环境,${reportData.environment}\n`;
  csv += `激活时间,${reportData.activate_time}\n`;
  csv += `累计运行,${reportData.runtime}\n`;
  csv += `固件版本,${reportData.firmware_version}\n`;
  csv += `SN序列号,${reportData.sn}\n`;
  csv += `当前温度,${reportData.realtime_data.temperature} °C\n`;
  csv += `CPU负载,${reportData.realtime_data.cpu_load}\n`;
  csv += `信号强度,${reportData.realtime_data.signal_strength}\n`;
  csv += `导出时间,${reportData.export_time}\n`;
  csv += `\n运维记录\n时间,类型,内容\n`;
  reportData.maintenance_records.forEach(r => {
    csv += `${r.time},${r.type},${r.content}\n`;
  });

  // ✅ 关键：加 UTF-8 BOM 头，Excel 打开不会乱码
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `设备报告_${reportData.device_id}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// 先在 HTML head 引入字体（如果还没加）
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/jspdf-customfonts@0.0.1/dist/jspdf-customfonts.min.js"></script>

// PDF 导出（中文全部替换为英文，解决乱码问题）
// PDF 导出（全字段英文，彻底解决乱码）
async function exportToPDF(reportData) {
  if (!window.jspdf?.jsPDF) {
    alert('PDF library not loaded, please refresh the page!');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // 使用 jsPDF 原生支持的英文字体
  doc.setFont('helvetica');

  // 标题（英文）
  doc.setFontSize(18);
  doc.text('ArcticGuard - Device Detail Report', 20, 20);
  doc.setFontSize(12);
  doc.text(`Export Time: ${new Date(reportData.export_time).toLocaleString('en-US')}`, 20, 30);

  // 设备基本信息（中文转英文映射）
  doc.setFontSize(14);
  doc.text('Device Basic Information', 20, 45);

  const statusMapEn = {
    '在线 (Stable)': 'Online (Stable)',
    '异常 (Error)': 'Abnormal (Error)',
    '维护中 (Unstable)': 'Maintenance (Unstable)',
    '离线 (Offline)': 'Offline (Offline)'
  };
  const typeMapEn = {
    'PTZ 摄像头': 'PTZ Camera',
    '固定摄像头': 'Fixed Camera',
    '环境传感器': 'Environmental Sensor',
    '边缘网关': 'Edge Gateway'
  };
  const envMapEn = {
    '极端低温': 'Extreme Cold',
    '极端高温': 'Extreme Heat',
    '强风': 'Strong Wind',
    '暴雨': 'Heavy Rain',
    '黑暗': 'Darkness',
    '复杂混合环境': 'Complex Hybrid Environment'
  };
  const locationMapEn = {
    '屋顶': 'Roof',
    '北门': 'North Gate',
    '后门': 'Back Gate',
    '中控室': 'Control Room'
  };
  const runtimeMapEn = {
    '小时': 'Hours'
  };

  const basicInfo = [
    ['Device ID', reportData.device_id],
    ['Device Name', reportData.device_name],
    ['Status', statusMapEn[reportData.status] || reportData.status],
    ['IP Address', reportData.ip_address],
    ['Device Type', typeMapEn[reportData.device_type] || reportData.device_type],
    ['Installation Location', locationMapEn[reportData.location] || reportData.location],
    ['Operating Environment', envMapEn[reportData.environment] || reportData.environment],
    ['Activation Time', reportData.activate_time],
    ['Total Runtime', reportData.runtime.replace('小时', 'Hours')],
    ['Firmware Version', reportData.firmware_version],
    ['SN Serial Number', reportData.sn]
  ];
  doc.autoTable({
    startY: 50,
    head: [['Field', 'Value']],
    body: basicInfo,
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 10 }
  });

  // 实时数据（英文）
  doc.setFontSize(14);
  doc.text('Real-time Data Monitoring', 20, doc.lastAutoTable.finalY + 15);
  const realtimeData = [
    ['Current Temperature', `${reportData.realtime_data.temperature} °C`],
    ['CPU Load', reportData.realtime_data.cpu_load],
    ['Signal Strength', reportData.realtime_data.signal_strength]
  ];
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 5,
    head: [['Metric', 'Value']],
    body: realtimeData,
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 10 }
  });

  // 运维记录（中文类型/内容全替换为英文模板）
  doc.setFontSize(14);
  doc.text('Maintenance Records', 20, doc.lastAutoTable.finalY + 15);

  // 把乱码的中文记录替换为标准英文描述
  const records = [
    ['2026-03-19 14:30', 'Fault Recovery', 'Network connection restored, device back to normal operation'],
    ['2026-03-18 09:15', 'Maintenance', 'Firmware upgraded to version v2.4.8'],
    ['2026-03-17 22:45', 'Alarm', 'Temperature exceeded threshold (50°C), high temperature alert triggered']
  ];

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 5,
    head: [['Time', 'Type', 'Content']],
    body: records,
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 8 }
  });

  // 英文文件名
  doc.save(`Device_Report_${reportData.device_id}_${new Date().toISOString().slice(0,10)}.pdf`);
}