// 导航栏高亮当前页面
document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 导航栏滚动阴影效果
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      nav.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    } else {
      nav.style.boxShadow = 'none';
    }
  });

  // 卡片点击波纹效果
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
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
});

// 添加波纹动画样式
const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(34, 211, 238, 0.3);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);