// ==============================
// 你的检测记录 JSON 数据
// ==============================
const detectRecords = [
  {
    "id": "fd3c901c-9514-4433-a641-7f639920a97b",
    "detect_time": "2026-03-22 12:24:29",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 89.0, "bbox": [69.32,150.22,158.30,356.52] },
      { "class": "person", "confidence": 84.15, "bbox": [174.57,162.74,234.51,355.65] }
    ],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "ab6ddc04-91ce-4328-b5c5-767cf518e37e",
    "detect_time": "2026-03-22 12:35:26",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 89.0, "bbox": [69.32,150.22,158.30,356.52] },
      { "class": "person", "confidence": 84.15, "bbox": [174.57,162.74,234.51,355.65] }
    ],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "10fce63f-576a-4865-8762-c53be865fb58",
    "detect_time": "2026-03-22 12:36:07",
    "detect_type": "图片",
    "detect_results": [],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "82b3fdbd-cc44-4812-860b-0771f1566395",
    "detect_time": "2026-03-22 12:36:13",
    "detect_type": "图片",
    "detect_results": [],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "6a107f75-4ecf-49a4-819d-7beb83cc9a16",
    "detect_time": "2026-03-22 12:36:37",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 89.9, "bbox": [103.57,86.69,256.93,410.95] }
    ],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "e85c8268-b98b-411b-811f-141e748a51f3",
    "detect_time": "2026-03-22 12:46:43",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 89.9, "bbox": [103.57,86.69,256.93,410.95] }
    ],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "a7f168b8-c578-4c29-98ab-a9561f97a164",
    "detect_time": "2026-03-22 12:49:59",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 89.9, "bbox": [103.57,86.69,256.93,410.95] }
    ],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "d6a65d55-2b92-49cc-ac60-15f7af191de1",
    "detect_time": "2026-03-22 12:51:06",
    "detect_type": "图片",
    "detect_results": [],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "193b9c5d-2a73-4b3e-8b1c-dc79ba802538",
    "detect_time": "2026-03-22 12:58:53",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 89.9, "bbox": [103.57,86.69,256.93,410.95] }
    ],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "3fe66610-3a09-4e3f-9542-74822e363601",
    "detect_time": "2026-03-22 12:59:01",
    "detect_type": "图片",
    "detect_results": [],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "61fffcfc-5de3-4e73-90ec-60c81028f96e",
    "detect_time": "2026-03-22 12:59:47",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 89.9, "bbox": [103.57,86.69,256.93,410.95] }
    ],
    "llm_suggestion": "检测到人体目标，建议确认区域人员安全状态"
  },
  {
    "id": "462aefb6-adc2-499d-95e5-5f2bee6a2b4b",
    "detect_time": "2026-03-22 13:08:00",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 80.31, "bbox": [228.46,109.78,342.47,364.93] },
      { "class": "person", "confidence": 67.85, "bbox": [22.28,122.00,108.82,318.35] },
      { "class": "bicycle", "confidence": 59.66, "bbox": [229.30,219.36,336.25,404.38] },
      { "class": "bicycle", "confidence": 40.59, "bbox": [0.10,212.40,94.82,412.94] },
      { "class": "person", "confidence": 30.4, "bbox": [0.17,173.50,43.08,229.05] },
      { "class": "motorcycle", "confidence": 28.24, "bbox": [0.04,211.61,97.40,412.56] }
    ],
    "llm_suggestion": "环境类型：雾天"
  },
  {
    "id": "102b8768-9a99-42cb-b894-7f48bbf52aed",
    "detect_time": "2026-03-22 14:25:56",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 90.99, "bbox": [30.77,350.07,256.18,820.87] },
      { "class": "person", "confidence": 78.19, "bbox": [385.29,403.63,475.51,642.59] },
      { "class": "person", "confidence": 72.52, "bbox": [0.02,354.07,42.52,717.49] },
      { "class": "person", "confidence": 71.73, "bbox": [189.26,396.07,247.78,558.84] },
      { "class": "person", "confidence": 71.41, "bbox": [1074.03,399.35,1131.81,555.14] },
      { "class": "person", "confidence": 68.85, "bbox": [233.45,401.54,289.81,566.70] },
      { "class": "person", "confidence": 65.76, "bbox": [973.76,406.42,1018.02,533.25] },
      { "class": "person", "confidence": 64.3, "bbox": [835.80,399.21,881.16,522.33] },
      { "class": "person", "confidence": 62.96, "bbox": [1037.63,402.71,1080.99,549.74] },
      { "class": "person", "confidence": 59.13, "bbox": [311.40,399.89,362.72,535.71] },
      { "class": "person", "confidence": 56.36, "bbox": [281.00,407.04,319.85,532.88] },
      { "class": "person", "confidence": 55.55, "bbox": [509.21,409.52,555.71,521.38] },
      { "class": "person", "confidence": 54.47, "bbox": [934.59,415.32,973.85,509.36] },
      { "class": "backpack", "confidence": 38.7, "bbox": [1234.15,450.98,1303.03,557.74] },
      { "class": "person", "confidence": 31.31, "bbox": [1145.97,400.21,1180.56,496.02] }
    ],
    "llm_suggestion": "环境类型：复杂混合天气"
  },
  {
    "id": "3e18f540-6480-417a-9ac2-489760f12f89",
    "detect_time": "2026-03-22 14:26:42",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 90.99, "bbox": [30.77,350.07,256.18,820.87] },
      { "class": "person", "confidence": 78.19, "bbox": [385.29,403.63,475.51,642.59] },
      { "class": "person", "confidence": 72.52, "bbox": [0.02,354.07,42.52,717.49] },
      { "class": "person", "confidence": 71.73, "bbox": [189.26,396.07,247.78,558.84] },
      { "class": "person", "confidence": 71.41, "bbox": [1074.03,399.35,1131.81,555.14] },
      { "class": "person", "confidence": 68.85, "bbox": [233.45,401.54,289.81,566.70] },
      { "class": "person", "confidence": 65.76, "bbox": [973.76,406.42,1018.02,533.25] },
      { "class": "person", "confidence": 64.3, "bbox": [835.80,399.21,881.16,522.33] },
      { "class": "person", "confidence": 62.96, "bbox": [1037.63,402.71,1080.99,549.74] },
      { "class": "person", "confidence": 59.13, "bbox": [311.40,399.89,362.72,535.71] },
      { "class": "person", "confidence": 56.36, "bbox": [281.00,407.04,319.85,532.88] },
      { "class": "person", "confidence": 55.55, "bbox": [509.21,409.52,555.71,521.38] },
      { "class": "person", "confidence": 54.47, "bbox": [934.59,415.32,973.85,509.36] },
      { "class": "backpack", "confidence": 38.7, "bbox": [1234.15,450.98,1303.03,557.74] },
      { "class": "person", "confidence": 31.31, "bbox": [1145.97,400.21,1180.56,496.02] }
    ],
    "llm_suggestion": "环境类型：正常环境"
  },
  {
    "id": "f124788d-8926-4140-9e46-7755db37164f",
    "detect_time": "2026-03-22 15:22:35",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 88.57, "bbox": [228.40,124.55,288.87,295.11] },
      { "class": "person", "confidence": 85.85, "bbox": [568.46,163.09,612.99,282.68] },
      { "class": "car", "confidence": 83.27, "bbox": [384.78,139.92,571.25,298.11] },
      { "class": "person", "confidence": 82.78, "bbox": [308.36,142.69,384.56,315.84] }
    ],
    "llm_suggestion": "环境类型：正常环境"
  },
  {
    "id": "9b3d8ccf-43f9-4cde-9959-d1edbf1581ac",
    "detect_time": "2026-03-22 22:35:11",
    "detect_type": "图片",
    "detect_results": [
      { "class": "person", "confidence": 89.17, "bbox": [163.07,108.81,285.32,414.77] },
      { "class": "person", "confidence": 83.12, "bbox": [428.05,164.51,465.58,276.38] },
      { "class": "person", "confidence": 45.34, "bbox": [487.99,169.93,535.26,252.41] }
    ],
    "llm_suggestion": "环境类型：正常环境"
  }
];

// ==============================
// 全局数据计算
// ==============================
let allTargets = [];
let classStats = {};
let hourlyStats = {};
let confidenceList = [];

// 解析所有数据
function parseAllData() {
  detectRecords.forEach(record => {
    const time = record.detect_time;
    const hour = time ? time.split(' ')[1].split(':')[0] + ':00' : '未知';
    if (!hourlyStats[hour]) hourlyStats[hour] = 0;

    const results = record.detect_results || [];
    results.forEach(t => {
      allTargets.push(t);
      confidenceList.push(t.confidence);
      hourlyStats[hour]++;

      const cls = t.class;
      if (!classStats[cls]) {
        classStats[cls] = { count: 0, confSum: 0, confList: [] };
      }
      classStats[cls].count++;
      classStats[cls].confSum += t.confidence;
      classStats[cls].confList.push(t.confidence);
    });
  });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function () {
  parseAllData();
  renderOverview();
  renderDistribution();
  renderTrendChart();
  renderConfidenceChart();
  renderClassCards();

  setTimeout(() => {
    hideLoader();
  }, 800);
});

// ==============================
// 1. 数据概览
// ==============================
function renderOverview() {
  const totalCount = detectRecords.length;
  const classCount = Object.keys(classStats).length;
  const targetCount = allTargets.length;
  const avgConf = targetCount > 0 ? (confidenceList.reduce((a,b)=>a+b,0)/targetCount).toFixed(1) : 0;

  document.getElementById('totalDetectCount').innerText = totalCount;
  document.getElementById('classCount').innerText = classCount;
  document.getElementById('totalTargetCount').innerText = targetCount;
  document.getElementById('avgConfidence').innerText = avgConf + '%';
}

// ==============================
// 2. 目标分布图表
// ==============================
let distributionChart;
function renderDistribution() {
  const ctx = document.getElementById('pestDistributionChart').getContext('2d');
  const classes = Object.keys(classStats);
  const counts = classes.map(c => classStats[c].count);

  const colors = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899'];
  const labels = classes.map(c => {
    if(c==='person')return '人员';
    if(c==='car')return '车辆';
    if(c==='bicycle')return '自行车';
    if(c==='motorcycle')return '摩托车';
    if(c==='backpack')return '背包';
    return c;
  });

  const data = {
    labels: labels,
    datasets: [{
      label: '目标数量',
      data: counts,
      backgroundColor: colors.slice(0, labels.length),
      borderWidth: 1
    }]
  };

  distributionChart = new Chart(ctx, {
    type: 'pie',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#e2e8f0' } } }
    }
  });

  // 右侧详情
  const total = counts.reduce((a,b)=>a+b,0);
  const detailEl = document.getElementById('distributionDetail');
  detailEl.innerHTML = classes.map((cls,i) => {
    const cnt = counts[i];
    const pct = ((cnt/total)*100).toFixed(1);
    const name = labels[i];
    return `
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-2" style="background:${colors[i]}"></div>
        <span class="text-sm text-slate-300">${name}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">${cnt}个</span>
        <div class="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full" style="width:${pct}%;background:${colors[i]}"></div>
        </div>
        <span class="text-xs text-slate-300">${pct}%</span>
      </div>
    </div>`;
  }).join('');

  // 切换图表
  document.getElementById('show-pie').onclick = () => {
    distributionChart.destroy();
    distributionChart = new Chart(ctx, { type:'pie', data, options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2e8f0' } } }
    }});
  };
  document.getElementById('show-bar').onclick = () => {
    distributionChart.destroy();
    distributionChart = new Chart(ctx, { type:'bar', data, options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display:false } },
      scales: { y: { ticks:{color:'#e2e8f0'}, grid:{color:'rgba(255,255,255,.1)} }, x: { ticks:{color:'#e2e8f0'} } }
    }});
  };
}

// ==============================
// 3. 检测趋势图表
// ==============================
function renderTrendChart() {
  const ctx = document.getElementById('detectionTrendChart').getContext('2d');
  const hours = Object.keys(hourlyStats).sort();
  const counts = hours.map(h => hourlyStats[h]);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours,
      datasets: [{
        label: '每小时检测目标数',
        data: counts,
        backgroundColor: '#22d3ee'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#e2e8f0' } } },
      scales: {
        y: { ticks: { color: '#e2e8f0' }, grid: { color: 'rgba(255,255,255,.1)' } },
        x: { ticks: { color: '#e2e8f0' } }
      }
    }
  });
}

// ==============================
// 4. 置信度分布
// ==============================
function renderConfidenceChart() {
  const ctx = document.getElementById('confidenceDistributionChart').getContext('2d');
  const bins = new Array(10).fill(0);
  confidenceList.forEach(c => {
    const idx = Math.floor(c/10);
    bins[idx < 10 ? idx :9]++;
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['0-10%','10-20%','20-30%','30-40%','40-50%','50-60%','60-70%','70-80%','80-90%','90-100%'],
      datasets: [{
        label: '置信度分布',
        data: bins,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,0.1)',
        tension: 0.4, fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#e2e8f0' } } },
      scales: { y: { ticks: { color: '#e2e8f0' } }, x: { ticks: { color: '#e2e8f0' } }
    }
  });
}

// ==============================
// 5. 类别分析卡片
// ==============================
function renderClassCards() {
  const container = document.getElementById('classAnalysisCards');
  const clsMap = {
    person: { name: '人员', icon: 'users-group-bold', color:'red' },
    car: { name: '汽车', icon: 'car-bold', color:'blue' },
    bicycle: { name: '自行车', icon: 'bike-bold', color:'yellow' },
    motorcycle: { name: '摩托车', icon: 'scooter-bold', color:'purple' },
    backpack: { name: '背包', icon: 'bag-bold', color:'slate' }
  };
  container.innerHTML = Object.keys(classStats).map(cls => {
    const stat = classStats[cls];
    const avg = (stat.confSum / stat.count).toFixed(1);
    const info = clsMap[cls] || {name:cls,icon:'cube-bold',color:'cyan'};
    const level = avg >= 80 ? '高' : avg >=60 ? '中' : '低';
    const levelCls = avg >=80 ? 'severity-high' : avg >=60 ? 'severity-medium' : 'severity-low';

    return `
    <div class="stat-card p-6 rounded-xl">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-lg font-bold text-white">${info.name}</h3>
          <p class="text-xs text-slate-400">${cls}</p>
        </div>
        <span class="iconify text-${info.color}-400 text-xl" data-icon="solar:${info.icon}"></span>
      </div>
      <div class="mb-4">
        <div class="flex justify-between mb-1">
          <span class="text-xs text-slate-400">平均置信度</span>
          <span class="text-sm text-white font-medium">${avg}%</span>
        </div>
        <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full bg-green-500" style="width:${avg}%"></div>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${levelCls}">${level}置信等级</span>
        <span class="text-xs text-slate-400 flex items-center gap-1">
          <span class="iconify text-sm" data-icon="solar:chart-square-bold"></span>
          总计 ${stat.count} 个
        </span>
      </div>
    </div>`;
  }).join('');
}

// ==============================
// 工具函数
// ==============================
function hideLoader() {
  const loader = document.getElementById('loaderContainer');
  loader.classList.add('loader-hidden');
  setTimeout(() => loader.remove(), 500);
}