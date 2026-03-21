// Tab 切换逻辑
function switchTab(tabName) {
    // 隐藏所有面板
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    // 重置所有按钮样式
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active');
        el.classList.add('border-transparent');
    });
    // 显示目标面板
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    // 激活目标按钮
    const activeBtn = event.currentTarget;
    activeBtn.classList.add('active');
    activeBtn.classList.remove('border-transparent');
}




// ==============================================
// 新增模型 - 下拉菜单 + 自动添加到模型列表功能
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    const addModelBtn = document.getElementById('addModelBtn');
    const modelDropdown = document.getElementById('modelDropdown');
    const modelList = document.querySelector('.space-y-4'); // 模型列表容器
    const options = document.querySelectorAll('.model-option');

    if(!addModelBtn || !modelDropdown) return;

    // 点击按钮显示/隐藏下拉
    addModelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modelDropdown.classList.toggle('hidden');
    });

    // 点击外部关闭下拉
    document.addEventListener('click', () => {
        modelDropdown.classList.add('hidden');
    });

    // 点击菜单内部不关闭
    modelDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // 选择模型 → 自动添加到列表
    options.forEach(option => {
        option.addEventListener('click', () => {
            const name = option.dataset.name;
            const desc = option.dataset.desc;
            const fps = option.dataset.fps;
            const prec = option.dataset.prec;

            modelDropdown.classList.add('hidden');

            const newModel = `
            <div class="p-4 rounded-lg bg-slate-800 border border-cyan-500/30">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-cyan-300">${name}</h4>
                    <span class="text-[10px] bg-green-500 text-white px-1 rounded">已导入</span>
                </div>
                <p class="text-xs text-slate-300">${desc}</p>
                <div class="mt-3 flex items-center justify-between text-[10px] font-mono opacity-60">
                    <span>FPS: ${fps}</span>
                    <span>PREC: ${prec}%</span>
                </div>
            </div>
            `;
            modelList.insertAdjacentHTML('afterbegin', newModel);
        });
    });
});