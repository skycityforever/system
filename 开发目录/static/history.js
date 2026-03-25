document.addEventListener('DOMContentLoaded', function() {
  // 1. 加载动画控制
  setTimeout(hideLoader, 1500);

  // 2. 静态测试数据
  const mockData = [
    { id: 1, time: '2026-03-18 14:22:10', location: '北区禁行带 04', weather: '暴雪', result: '2 人非法越界', confidence: 98.4, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/52dba422bec340d29a6df2e4ffeccd42.jpg' },
    { id: 2, time: '2026-03-18 14:18:05', location: '西侧货场入口', weather: '强浓雾', result: '倒地报警', confidence: 92.1, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/ee1176c3f1104fe696517b217edfc7ea.jpg' },
    { id: 3, time: '2026-03-18 13:50:44', location: '主办公楼外围', weather: '正常', result: '正常巡检流程', confidence: 99.2, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/ee1176c3f1104fe696517b217edfc7ea.jpg' },
    { id: 4, time: '2026-03-17 23:12:10', location: '南门 01', weather: '暴雨', result: '多人非法聚集', confidence: 87.5, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/ee1176c3f1104fe696517b217edfc7ea.jpg' },
    { id: 5, time: '2026-03-18 16:30:22', location: '东区哨所 02', weather: '暴雪', result: '单人翻越围栏', confidence: 91.3, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/52dba422bec340d29a6df2e4ffeccd42.jpg' },
    { id: 6, time: '2026-03-18 15:45:11', location: '北区禁行带 03', weather: '强浓雾', result: '车辆违规驶入', confidence: 89.7, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/ee1176c3f1104fe696517b217edfc7ea.jpg' },
    { id: 7, time: '2026-03-17 21:05:33', location: '西侧货场出口', weather: '暴雨', result: '人员倒地', confidence: 83.2, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/ee1176c3f1104fe696517b217edfc7ea.jpg' },
    { id: 8, time: '2026-03-18 11:20:47', location: '主办公楼大门', weather: '正常', result: '正常巡检流程', confidence: 97.8, thumbnail: 'https://modao.cc/agent-py/media/generated_images/2026-03-18/ee1176c3f1104fe696517b217edfc7ea.jpg' },
  ];

  // 3. 状态管理
  let currentData = [...mockData];
  let currentPage = 1;
  const pageSize = 4;

  // 4. DOM 元素
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

  // 5. 初始化渲染
  renderResults();
  renderPagination();

  // 6. 置信度滑块实时显示
  confidenceSlider.addEventListener('input', () => {
    sliderValue.textContent = `${confidenceSlider.value}%`;
  });

  // 7. 执行筛选
  executeSearch.addEventListener('click', () => {
    const selectedDate = filterDate.value;
    const selectedWeathers = Array.from(weatherCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    const minConfidence = parseInt(confidenceSlider.value);

    // 筛选逻辑
    currentData = mockData.filter(item => {
      const itemDate = item.time.split(' ')[0];
      const matchDate = selectedDate ? itemDate === selectedDate : true;
      const matchWeather = selectedWeathers.includes(item.weather) || item.weather === '正常';
      const matchConfidence = item.confidence >= minConfidence;
      return matchDate && matchWeather && matchConfidence;
    });

    currentPage = 1;
    renderResults();
    renderPagination();
  });

  // 8. 视图切换
  viewList.addEventListener('click', () => {
    listView.classList.remove('hidden');
    gridView.classList.add('hidden');
    viewList.classList.add('active');
    viewGrid.classList.remove('active');
  });
  viewGrid.addEventListener('click', () => {
    gridView.classList.remove('hidden');
    listView.classList.add('hidden');
    viewGrid.classList.add('active');
    viewList.classList.remove('active');
  });

  // 9. 分页控制
  prevPage.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderResults();
      renderPagination();
    }
  });
  nextPage.addEventListener('click', () => {
    const totalPages = Math.ceil(currentData.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      renderResults();
      renderPagination();
    }
  });

  // 10. 渲染结果列表
  function renderResults() {
    // 更新总数
    resultCount.textContent = `共 ${currentData.length} 条记录`;

    // 分页截取
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = currentData.slice(start, end);

    // 渲染表格
    resultTableBody.innerHTML = pageData.map(item => `
      <tr class="bg-slate-800/30 hover:bg-slate-800/60 transition-colors group">
        <td class="p-4">
          <div class="w-24 h-16 rounded overflow-hidden relative">
            <img alt="事件预览" class="w-full h-full object-cover" src="${item.thumbnail}"/>
            <div class="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span class="iconify text-2xl" data-icon="solar:play-circle-bold"></span>
            </div>
          </div>
        </td>
        <td class="p-4 font-mono text-cyan-400">${item.time}</td>
        <td class="p-4">${item.location}</td>
        <td class="p-4">
          <span class="px-2 py-1 ${getWeatherClass(item.weather)} text-[10px]">${item.weather === '正常' ? '正常' : `${item.weather}(${getWeatherTag(item.weather)})`}</span>
        </td>
        <td class="p-4">
          <div class="flex flex-col gap-1">
            <span class="${getResultClass(item.result)} font-bold">${item.result}</span>
            ${item.confidence ? `<span class="text-[10px] text-slate-500">置信度: ${item.confidence}%</span>` : ''}
          </div>
        </td>
        <td class="p-4 text-center">
          <button class="px-4 py-2 bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600 hover:text-white rounded-md transition-all text-xs">详情取证</button>
        </td>
      </tr>
    `).join('');

    // 渲染卡片
    gridView.innerHTML = pageData.map(item => `
      <div class="event-card">
        <div class="event-card-thumbnail">
          <img src="${item.thumbnail}" alt="事件预览"/>
        </div>
        <div class="event-card-info">
          <div class="event-card-time">${item.time}</div>
          <div class="event-card-location">${item.location}</div>
          <div class="event-card-weather ${getWeatherClass(item.weather)}">${item.weather}</div>
          <div class="event-card-result ${getResultClass(item.result)}">${item.result}</div>
          <button class="event-card-btn">详情取证</button>
        </div>
      </div>
    `).join('');
  }

  // 11. 渲染分页
  function renderPagination() {
    const totalPages = Math.ceil(currentData.length / pageSize);
    paginationNumbers.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `pagination-btn ${i === currentPage ? 'active' : ''} px-4 py-2 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:bg-slate-700`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        currentPage = i;
        renderResults();
        renderPagination();
      });
      paginationNumbers.appendChild(btn);
    }
  }

  // 辅助函数：获取天气标签样式
  function getWeatherClass(weather) {
    switch(weather) {
      case '暴雪': return 'bg-blue-500/20 text-blue-400 border border-blue-500/20';
      case '暴雨': return 'bg-orange-500/20 text-orange-400 border border-orange-500/20';
      case '强浓雾': return 'bg-orange-500/20 text-orange-400 border border-orange-500/20';
      case '沙尘暴': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20';
      default: return 'bg-slate-700/50 text-slate-400 border border-slate-700';
    }
  }
  function getWeatherTag(weather) {
    switch(weather) {
      case '暴雪': return '红';
      case '暴雨': return '橙';
      case '强浓雾': return '橙';
      case '沙尘暴': return '黄';
      default: return '';
    }
  }
  function getResultClass(result) {
    if (result.includes('非法') || result.includes('聚集')) return 'text-red-400';
    if (result.includes('报警') || result.includes('倒地')) return 'text-yellow-400';
    if (result.includes('正常')) return 'text-green-400';
    return 'text-slate-300';
  }
});

// 隐藏加载动画
function hideLoader() {
  const loaderContainer = document.getElementById('loaderContainer');
  if (loaderContainer) {
    loaderContainer.classList.add('loader-hidden');
    setTimeout(() => loaderContainer.remove(), 500);
  }
}