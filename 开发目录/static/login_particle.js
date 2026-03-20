// 1. 基础配置
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];

// 核心参数（可自由调整）
const config = {
    particleCount: 200,
    particleSize: 2,
    moveSpeed: 0.4,
    connectDistance: 150,
    mouseRadius: 200
};

// 2. 适配窗口
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 3. 鼠标对象
const mouse = {
    x: null,
    y: null,
    isActive: false
};

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
    mouse.isActive = true;
});
window.addEventListener('mouseout', () => {
    mouse.isActive = false;
});

// 4. 粒子类
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.dx = (Math.random() - 0.5) * config.moveSpeed;
        this.dy = (Math.random() - 0.5) * config.moveSpeed;
        this.size = config.particleSize;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x < 0 || this.x > canvas.width) this.dx = -this.dx;
        if (this.y < 0 || this.y > canvas.height) this.dy = -this.dy;
    }

    draw() {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 5. 绘制连线
function connectParticles() {
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
            const p1 = particlesArray[a];
            const p2 = particlesArray[b];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.connectDistance) {
                const opacity = 1 - (distance / config.connectDistance);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = opacity * 1.5;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        if (mouse.isActive) {
            const dx = particlesArray[a].x - mouse.x;
            const dy = particlesArray[a].y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.mouseRadius) {
                const opacity = 1 - (distance / config.mouseRadius);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = opacity * 1.5;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
    }
}

// 6. 初始化粒子
function initParticles() {
    particlesArray = [];
    for (let i = 0; i < config.particleCount; i++) {
        particlesArray.push(new Particle());
    }
}

// 7. 动画循环
function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesArray.forEach(particle => {
        particle.update();
        particle.draw();
    });

    connectParticles();
    requestAnimationFrame(animate);
}

// 启动效果
initParticles();
animate();