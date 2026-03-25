document.addEventListener('DOMContentLoaded', function() {
  // ==============================================
  // 1. 你的检测记录 JSON（直接内置）
  // ==============================================
  const detectJsonData = [
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
      "llm_suggestion": "环境类型：雾天 | 防护建议：穿戴防滑防风衣物，避免在低能见度环境下行走; 控制车速，避免急刹车或超车，保持安全距离; 如需外出，建议选择公共交通工具或室内活动"
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
      "llm_suggestion": "环境类型：复杂混合天气（同时存在多种恶劣条件） | 防护建议：穿戴防寒保暖衣物，佩戴防风面罩和护目镜，防止沙尘和强风对身体造成伤害。; 避免在极端天气条件下进行户外作业，必要时应暂停作业并撤离现场。; 配备应急通讯设备，确保在紧急情况下能够及时联系救援或支持人员。"
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
      "llm_suggestion": "环境类型：正常环境 | 防护建议：穿戴常规劳保用品，按标准流程作业; 定时检查设备运行状态，确保通讯畅通; 保持作业区域整洁，避免无关杂物堆积"
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
      "llm_suggestion": "环境类型：正常环境（无极端天气） | 防护建议：根据图片描述，环境无极端恶劣天气，无需特殊防护建议。; 保持常规防护措施，如穿着适宜衣物，注意保暖和防滑。"
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
      "llm_suggestion": "环境类型：正常环境（无极端天气） | 防护建议：在正常环境下，户外作业人员应穿戴适当的防护装备，如防滑鞋和防护服，以应对可能的意外。; 保持警惕，注意周围环境变化，避免因天气突变或地形复杂导致的意外。; 在作业过程中，确保通讯设备畅通，以便在紧急情况下及时求助。"
    }
  ];

  // ==============================================
  // 2. 原有静态数据（保留）
  // ==============================================
  const staticMockData = [
    { id: 'static-1', time: '2026-03-18 14:22:10', location: '北区禁行带 04', weather: '暴雪', result: '2 人非法越界', confidence: 98.4, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/52dba422bec340d29a6df2e4ffeccd42.jpg' },
    { id: 'static-2', time: '2026-03-18 14:18:05', location: '西侧货场入口', weather: '强浓雾', result: '倒地报警', confidence: 92.1, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/ee1176c3f1104fe696517b217edfc7ea.jpg' },
    { id: 'static-3', time: '2026-03-18 13:50:44', location: '主办公楼外围', weather: '正常', result: '正常巡检流程', confidence: 99.2, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/ee1176c3f1104fe696517b217edfc7ea.jpg' },
    { id: 'static-4', time: '2026-03-17 23:12:10', location: '南门 01', weather: '暴雨', result: '多人非法聚集', confidence: 87.5, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/ee1176c3f1104fe696517b217edfc7ea.jpg' }
  ];

  // ==============================================
  // 3. 合并数据：静态 + JSON
  // ==============================================
  const mergedData = convertJsonToRecord(detectJsonData).concat(staticMockData);

  // ==============================================
  // 4. 全局状态
  // ==============================================
  let currentData = [...mergedData];
  let currentPage = 1;
  const pageSize = 6;
  const detailModal = document.getElementById('detailModal');
  const closeModal = document.getElementById('closeModal');
  const detailContent = document.getElementById('detailContent');

  // ==============================================
  // 5. DOM 元素
  // ==============================================
  const filterDate = document.getElementById('filterDate');
  const weatherCheckboxes = document.querySelectorAll('.weather-checkbox');
  const confidenceSlider = document.getElementById('confidenceSlider');
  const sliderValue = document.getElementById('sliderValue');
  const executeSearch = document.getElementById('executeSearch');
  const resultCount = document.getElementById('resultCount');
  const resultTableBody = document.getElementById('resultTableBody');
  const gridView = document.getElementById('gridView');
  const listView = document.getElementById('listView');
  const viewList = document.getElementById('viewList');
  const viewGrid = document.getElementById('viewGrid');
  const paginationNumbers = document.getElementById('paginationNumbers');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');

  // 初始化
  setTimeout(hideLoader, 1000);
  renderResults();
  renderPagination();

  // ==============================================
  // 核心：JSON 转页面记录
  // ==============================================
  function convertJsonToRecord(jsonArr) {
    return jsonArr.map(item => {
      const resCount = item.detect_results?.length || 0;
      let resultText = resCount === 0 ? '未检测到目标' : `检测到 ${resCount} 个目标`;
      let maxConf = 0;
      if (resCount > 0) {
        maxConf = Math.max(...item.detect_results.map(r => r.confidence));
      }
      return {
        id: item.id,
        time: item.detect_time || '-',
        location: '-',
        weather: '-',
        result: resultText,
        confidence: maxConf,
        thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/52dba422bec340d29a6df2e4ffeccd42.jpg',
        source: 'json',
        rawData: item
      };
    });
  }

  // ==============================================
  // 渲染列表 + 卡片
  // ==============================================
  function renderResults() {
    resultCount.textContent = `共 ${currentData.length} 条记录`;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = currentData.slice(start, end);

    // 表格
    resultTableBody.innerHTML = pageData.map(item => `
      <tr class="bg-slate-800/30 hover:bg-slate-800/60 transition-colors group">
        <td class="p-4">
          <div class="w-24 h-16 rounded overflow-hidden relative">
            <img alt="预览" class="w-full h-full object-cover" src="${item.thumbnail}"/>
            <div class="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span class="iconify text-2xl" data-icon="solar:play-circle-bold"></span>
            </div>
          </div>
        </td>
        <td class="p-4 font-mono text-cyan-400">${item.time}</td>
        <td class="p-4">${item.location}</td>
        <td class="p-4">
          <span class="px-2 py-1 ${getWeatherClass(item.weather)} text-[10px]">${item.weather}</span>
        </td>
        <td class="p-4">
          <div class="flex flex-col gap-1">
            <span class="${getResultClass(item.result)} font-bold">${item.result}</span>
            <span class="text-[10px] text-slate-500">置信度: ${item.confidence || 0}%</span>
          </div>
        </td>
        <td class="p-4 text-center">
          <button onclick="showDetail('${item.id}')" class="px-4 py-2 bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600 hover:text-white rounded-md text-xs">详情取证</button>
        </td>
      </tr>
    `).join('');

    // 卡片
    gridView.innerHTML = pageData.map(item => `
      <div class="event-card">
        <div class="event-card-thumbnail"><img src="${item.thumbnail}" alt="预览"/></div>
        <div class="event-card-info">
          <div class="event-card-time">${item.time}</div>
          <div class="event-card-location">${item.location}</div>
          <div class="event-card-weather ${getWeatherClass(item.weather)}">${item.weather}</div>
          <div class="event-card-result ${getResultClass(item.result)}">${item.result}</div>
          <button onclick="showDetail('${item.id}')" class="event-card-btn">详情取证</button>
        </div>
      </div>
    `).join('');
  }

  // ==============================================
  // 详情弹窗
  // ==============================================
  window.showDetail = function(recordId) {
    const item = currentData.find(d => d.id === recordId);
    if (!item) return;
    if (!item.rawData) {
      detailContent.innerHTML = `<p class="text-red-400">该记录无详细检测数据</p>`;
      detailModal.classList.remove('hidden');
      return;
    }

    const d = item.rawData;
    let html = `
      <div class="detail-item"><span class="detail-label">记录ID：</span><span class="detail-value">${d.id}</span></div>
      <div class="detail-item"><span class="detail-label">检测时间：</span><span class="detail-value">${d.detect_time || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">检测类型：</span><span class="detail-value">${d.detect_type || '-'}</span></div>
      <div class="detail-item"><span class="detail-label">LLM建议：</span><span class="detail-value">${d.llm_suggestion || '-'}</span></div>
      <div class="mt-4"><p class="text-cyan-400 font-bold mb-2">检测目标列表：</p>`;

    if (!d.detect_results || d.detect_results.length === 0) {
      html += `<p class="text-slate-400">无检测目标</p>`;
    } else {
      d.detect_results.forEach((r, idx) => {
        html += `
          <div class="result-item">
            <div>序号：${idx+1}</div>
            <div>类别：${r.class}</div>
            <div>置信度：${r.confidence}%</div>
            <div>坐标：${r.bbox.map(n => n.toFixed(2)).join(', ')}</div>
          </div>`;
      });
    }
    html += '</div>';
    detailContent.innerHTML = html;
    detailModal.classList.remove('hidden');
  };

  closeModal.addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.add('hidden');
  });

  // ==============================================
  // 工具函数
  // ==============================================
  function getWeatherClass(w) {
    if (!w || w === '-') return 'bg-slate-700/50 text-slate-400';
    switch(w) {
      case '暴雪': return 'bg-blue-500/20 text-blue-400';
      case '暴雨': return 'bg-orange-500/20 text-orange-400';
      case '强浓雾': return 'bg-orange-500/20 text-orange-400';
      case '沙尘暴': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-green-500/20 text-green-400';
    }
  }
  function getResultClass(r) {
    if (r.includes('非法') || r.includes('聚集')) return 'text-red-400';
    if (r.includes('报警') || r.includes('倒地')) return 'text-yellow-400';
    if (r.includes('正常') || r.includes('未检测')) return 'text-green-400';
    return 'text-slate-300';
  }

  // 筛选
  confidenceSlider.addEventListener('input', () => {
    sliderValue.textContent = `${confidenceSlider.value}%`;
  });
  executeSearch.addEventListener('click', () => {
    const date = filterDate.value;
    const weathers = Array.from(weatherCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    const minConf = +confidenceSlider.value;
    currentData = mergedData.filter(item => {
      const matchDate = !date || item.time.startsWith(date);
      const matchWeather = weathers.includes(item.weather) || item.weather === '-';
      const matchConf = (item.confidence || 0) >= minConf;
      return matchDate && matchWeather && matchConf;
    });
    currentPage = 1;
    renderResults();
    renderPagination();
  });

  // 视图切换
  viewList.addEventListener('click', () => {
    listView.classList.remove('hidden'); gridView.classList.add('hidden');
    viewList.classList.add('active'); viewGrid.classList.remove('active');
  });
  viewGrid.addEventListener('click', () => {
    gridView.classList.remove('hidden'); listView.classList.add('hidden');
    viewGrid.classList.add('active'); viewList.classList.remove('active');
  });

  // 分页
  function renderPagination() {
    const total = Math.ceil(currentData.length / pageSize);
    paginationNumbers.innerHTML = '';
    for (let i = 1; i <= total; i++) {
      const btn = document.createElement('button');
      btn.className = `pagination-btn ${i === currentPage ? 'active' : ''} px-4 py-2 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:bg-slate-700`;
      btn.textContent = i;
      btn.addEventListener('click', () => { currentPage = i; renderResults(); renderPagination(); });
      paginationNumbers.appendChild(btn);
    }
  }
  prevPage.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderResults(); renderPagination(); }
  });
  nextPage.addEventListener('click', () => {
    if (currentPage < Math.ceil(currentData.length / pageSize)) { currentPage++; renderResults(); renderPagination(); }
  });
});

function hideLoader() {
  const el = document.getElementById('loaderContainer');
  el.classList.add('loader-hidden');
  setTimeout(() => el.remove(), 500);
}