// 切换登录/注册面板
function toggleForm() {
    const login = document.getElementById('loginForm');
    const register = document.getElementById('registerForm');
    login.classList.toggle('active');
    register.classList.toggle('active');
    document.getElementById('regMsg').innerHTML = '';
    document.getElementById('regForm').reset();
}

// AJAX 无刷新注册
document.getElementById('regForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const repassword = document.getElementById('regRepassword').value;
    const msgBox = document.getElementById('regMsg');

    if (password !== repassword) {
        msgBox.innerHTML = '两次密码不一致';
        msgBox.className = 'message error';
        return;
    }

    fetch(window.registerApiUrl, { // 替换原来的{{ url_for(...) }}
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.code === 200) {
            msgBox.innerHTML = '注册成功！正在返回登录...';
            msgBox.className = 'message success';
            setTimeout(() => toggleForm(), 1500);
        } else {
            msgBox.innerHTML = data.msg;
            msgBox.className = 'message error';
        }
    });
});