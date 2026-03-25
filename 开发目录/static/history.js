document.addEventListener('DOMContentLoaded', function() {
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
  // 全局状态（全部保留原样）
  // ==============================================
  let mergedData = [];
  let currentData = [];
  let currentPage = 1;
  const pageSize = 6;

  // ==============================================
  // DOM 元素（全部保留原样）
  // ==============================================
  const detailModal = document.getElementById('detailModal');
  const closeModal = document.getElementById('closeModal');
  const detailContent = document.getElementById('detailContent');
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

  // ==============================================
  // 核心函数：JSON 转页面记录（完全不变）
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
  // 渲染（完全不变）
  // ==============================================
  function renderResults() {
    resultCount.textContent = `共 ${currentData.length} 条记录`;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = currentData.slice(start, end);

    resultTableBody.innerHTML = pageData.map(item => `
      <tr class="bg-slate-800/30 hover:bg-slate-800/60 transition-colors group">
        <td class="p-4">
          <div class="w-24 h-16 rounded overflow-hidden relative">
            <img alt="预览" class="w-full h-full object-cover" src="${item.thumbnail}"/>
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
  // 详情弹窗（完全不变）
  // ==============================================
  window.showDetail = function(recordId) {
    const item = currentData.find(d => d.id === recordId);
    if (!item) return;
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
    detailContent.innerHTML = html;
    detailModal.classList.remove('hidden');
  };

  closeModal.addEventListener('click', () => detailModal.classList.add('hidden'));
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.add('hidden');
  });

  // ==============================================
  // 工具函数（完全不变）
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

  // ==============================================
  // 筛选功能（完全不变，正常使用！）
  // ==============================================
  confidenceSlider.addEventListener('input', () => {
    sliderValue.textContent = `${confidenceSlider.value}%`;
  });

  executeSearch.addEventListener('click', () => {
    const date = filterDate.value;
    const weathers = Array.from(weatherCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    const minConf = +confidenceSlider.value;

    currentData = mergedData.filter(item => {
      const matchDate = !date || item.time.startsWith(date);
      const matchWeather = weathers.length === 0 || weathers.includes(item.weather) || item.weather === '-';
      const matchConf = (item.confidence || 0) >= minConf;
      return matchDate && matchWeather && matchConf;
    });

    currentPage = 1;
    renderResults();
    renderPagination();
  });

  // ==============================================
  // 视图切换 + 分页（完全不变）
  // ==============================================
  viewList.addEventListener('click', () => {
    listView.classList.remove('hidden'); gridView.classList.add('hidden');
    viewList.classList.add('active'); viewGrid.classList.remove('active');
  });
  viewGrid.addEventListener('click', () => {
    gridView.classList.remove('hidden'); listView.classList.add('hidden');
    viewGrid.classList.add('active'); viewList.classList.remove('active');
  });

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

  // ==============================================
  // 动态从后端加载数据（唯一改动点）
  // ==============================================
  function loadData() {
    fetch('/api/detection_records')
      .then(res => res.json())
      .then(data => {
        const realRecords = convertJsonToRecord(data.records || []);
        mergedData = realRecords.concat(staticMockData);
        currentData = [...mergedData];
        renderResults();
        renderPagination();
      })
      .catch(() => {
        mergedData = [...staticMockData];
        currentData = [...mergedData];
        renderResults();
        renderPagination();
      });
  }

  // 初始化
  loadData();
  setTimeout(hideLoader, 1000);
});

function hideLoader() {
  const el = document.getElementById('loaderContainer');
  el.classList.add('loader-hidden');
  setTimeout(() => el.remove(), 500);
}