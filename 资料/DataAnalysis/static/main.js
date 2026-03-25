// 后端接口基础地址
const BASE_URL = "http://127.0.0.1:8000/api";

// 页面加载完成后执行
document.addEventListener("DOMContentLoaded", async () => {
    // 元素获取
    const sceneSelect = document.getElementById("scene-select");
    const newSceneInput = document.getElementById("new-scene");
    const addSceneBtn = document.getElementById("add-scene-btn");
    const fileUpload = document.getElementById("file-upload");
    const analyzeBtn = document.getElementById("analyze-btn");
    const resultSection = document.getElementById("result-section");
    const resultContent = document.getElementById("result-content");

    // 初始化：加载所有场景
    await loadScenes();

    // 事件绑定：添加自定义场景
    addSceneBtn.addEventListener("click", async () => {
        const sceneName = newSceneInput.value.trim();
        if (!sceneName) {
            alert("请输入自定义场景名称！");
            return;
        }
        try {
            const res = await axios.post(`${BASE_URL}/scenes`, { scene_name: sceneName });
            alert(res.data.msg);
            newSceneInput.value = "";
            await loadScenes(); // 重新加载场景
        } catch (err) {
            alert(err.response?.data?.detail || "添加场景失败！");
        }
    });

    // 事件绑定：开始分析
    analyzeBtn.addEventListener("click", async () => {
        const file = fileUpload.files[0];
        const scene = sceneSelect.value;
        if (!file) {
            alert("请选择要上传的图片/视频文件！");
            return;
        }
        if (!scene) {
            alert("请选择场景！");
            return;
        }

        // 构建表单数据
        const formData = new FormData();
        formData.append("file", file);
        formData.append("scene", scene);

        try {
            // 禁用按钮，防止重复提交
            analyzeBtn.disabled = true;
            analyzeBtn.innerText = "分析中...";
            // 请求后端分析接口
            const res = await axios.post(`${BASE_URL}/analyze`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            // 渲染分析结果
            resultSection.style.display = "block";
            resultContent.innerText = JSON.stringify(res.data.data, null, 4);
        } catch (err) {
            alert(err.response?.data?.detail || "分析失败！");
        } finally {
            // 启用按钮
            analyzeBtn.disabled = false;
            analyzeBtn.innerText = "开始分析";
        }
    });

    // 加载所有场景（默认+自定义）
    async function loadScenes() {
        try {
            const res = await axios.get(`${BASE_URL}/scenes`);
            const { default_scenes, custom_scenes } = res.data;
            // 清空下拉框
            sceneSelect.innerHTML = "";
            // 添加默认场景
            default_scenes.forEach(scene => {
                const option = document.createElement("option");
                option.value = scene;
                option.innerText = scene;
                sceneSelect.appendChild(option);
            });
            // 添加自定义场景
            if (custom_scenes.length > 0) {
                const optgroup = document.createElement("optgroup");
                optgroup.label = "自定义场景";
                custom_scenes.forEach(scene => {
                    const option = document.createElement("option");
                    option.value = scene;
                    option.innerText = scene;
                    optgroup.appendChild(option);
                });
                sceneSelect.appendChild(optgroup);
            }
        } catch (err) {
            alert("加载场景失败！");
        }
    }
});