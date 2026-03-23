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