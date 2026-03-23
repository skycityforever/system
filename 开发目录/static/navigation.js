document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    const loader = document.getElementById('loaderContainer');
    loader.classList.add('loader-hidden');
    initPage();
  }, 1500);
});

function initPage() {
  // 导航高亮
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 滚动阴影
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10 ? '0 4px 12px rgba(0,0,0,0.3)' : 'none';
  });

  // 卡片波纹
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('click', e => {
      const ripple = document.createElement('span');
      const rect = card.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      card.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // 快捷操作
  const upload = document.getElementById('quickUploadBtn');
  const alertBtn = document.getElementById('quickAlertBtn');
  const refresh = document.getElementById('quickRefreshBtn');

  upload.addEventListener('click', () => {
    location.href = '/object_detection_controlcenter';
  });

  alertBtn.addEventListener('click', () => {
    if (confirm('检测到3条未处理告警，是否前往监控中心？')) {
      location.href = '/visual_dashboard';
    }
  });

  refresh.addEventListener('click', async () => {
    refresh.innerHTML = '<span class="iconify animate-spin" data-icon="solar:refresh-bold"></span> 刷新中...';
    refresh.disabled = true;
    setTimeout(() => {
      document.getElementById('onlineDevices').textContent = Math.floor(Math.random()*10+40);
      document.getElementById('todayDetect').textContent = Math.floor(Math.random()*200+1200).toLocaleString();
      document.getElementById('modelAccuracy').textContent = (98+Math.random()*0.5).toFixed(1)+'%';
      document.getElementById('avgLatency').textContent = (8+Math.random()*1).toFixed(1)+'ms';
      refresh.innerHTML = '<span class="iconify" data-icon="solar:refresh-bold"></span> 刷新系统状态';
      refresh.disabled = false;
      alert('系统状态已刷新！');
    }, 1000);
  });
}