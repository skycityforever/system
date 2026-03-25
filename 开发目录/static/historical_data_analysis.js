// 加载动画控制逻辑 - 复制到<script>标签
document.addEventListener('DOMContentLoaded', function() {
    // 1. 基础用法：固定延迟隐藏（适合纯静态页面）
    setTimeout(() => {
        hideLoader();
    }, 1500); // 1.5秒后隐藏，可调整时长

    // 2. 进阶用法：数据加载完成后隐藏（适合有接口请求的页面）
    // 示例：调用接口后隐藏
    // loadData().then(() => {
    //     hideLoader();
    // });
});

// 通用隐藏加载动画的函数
function hideLoader() {
    const loaderContainer = document.getElementById('loaderContainer');
    if (loaderContainer) {
        loaderContainer.classList.add('loader-hidden');
        // 动画结束后移除DOM（可选，避免占用DOM）
        setTimeout(() => {
            loaderContainer.remove();
        }, 500);
    }
}

// 示例：模拟数据加载（实际项目替换为真实接口）
// function loadData() {
//     return new Promise((resolve) => {
//         // 模拟API请求
//         setTimeout(() => {
//             resolve();
//         }, 2000);
//     });
// }

document.addEventListener('DOMContentLoaded', function () {
    // 关闭加载动画
    setTimeout(() => {
        document.getElementById('loaderContainer').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loaderContainer').style.display = 'none';
        }, 300);
    }, 800);

    // ==============================================
    // 目标分布饼图 / 柱状图
    // ==============================================
    const pestDistributionCtx = document.getElementById('pestDistributionChart').getContext('2d');
    const pestData = {
        labels: ['病害苹果', '腐烂苹果', '优质苹果', '一般苹果'],
        datasets: [{
            label: '目标分布',
            data: [12, 44, 12, 4],
            backgroundColor: ['#ef4444', '#78350f', '#22c55e', '#eab308'],
            borderWidth: 1
        }]
    };

    let pestDistributionChart = new Chart(pestDistributionCtx, {
        type: 'pie',
        data: pestData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#e2e8f0' } },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // 切换饼图
    document.getElementById('show-pie').addEventListener('click', function () {
        if (pestDistributionChart.config.type === 'pie') return;
        pestDistributionChart.destroy();
        pestDistributionChart = new Chart(pestDistributionCtx, {
            type: 'pie',
            data: pestData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#e2e8f0' } },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        this.classList.add('btn-primary');
        this.classList.remove('btn-secondary');
        document.getElementById('show-bar').classList.remove('btn-primary');
        document.getElementById('show-bar').classList.add('btn-secondary');
    });

    // 切换柱状图
    document.getElementById('show-bar').addEventListener('click', function () {
        if (pestDistributionChart.config.type === 'bar') return;
        pestDistributionChart.destroy();
        pestDistributionChart = new Chart(pestDistributionCtx, {
            type: 'bar',
            data: pestData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '检测次数', color: '#e2e8f0' },
                        ticks: { color: '#e2e8f0' },
                        grid: { color: 'rgba(226, 232, 240, 0.1)' }
                    },
                    x: {
                        title: { display: true, text: '目标类别', color: '#e2e8f0' },
                        ticks: { color: '#e2e8f0' },
                        grid: { display: false }
                    }
                }
            }
        });
        this.classList.add('btn-primary');
        this.classList.remove('btn-secondary');
        document.getElementById('show-pie').classList.remove('btn-primary');
        document.getElementById('show-pie').classList.add('btn-secondary');
    });

    // ==============================================
    // 置信度密度分布图表
    // ==============================================
    const confidenceDistributionCtx = document.getElementById('confidenceDistributionChart').getContext('2d');
    const densityData = {
        labels: Array.from({ length: 100 }, (_, i) => i + 1),
        datasets: [{
            label: '置信度密度分布',
            data: Array(80).fill(0.002).concat(Array(20).fill(0.032)),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        }]
    };

    new Chart(confidenceDistributionCtx, {
        type: 'line',
        data: densityData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#e2e8f0' } },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `置信度: ${context.parsed.x}% | 密度: ${context.parsed.y.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '密度', color: '#e2e8f0' },
                    ticks: { color: '#e2e8f0' },
                    grid: { color: 'rgba(226, 232, 240, 0.1)' }
                },
                x: {
                    title: { display: true, text: '置信度 (%)', color: '#e2e8f0' },
                    ticks: { color: '#e2e8f0', callback: function (value) { return value + '%'; } },
                    grid: { display: false }
                }
            }
        }
    });
});