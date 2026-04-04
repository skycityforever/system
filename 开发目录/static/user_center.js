// 页面加载完成后获取用户信息
document.addEventListener('DOMContentLoaded', function() {
    fetchCurrentUserInfo();
});

// 获取当前登录用户信息
function fetchCurrentUserInfo() {
    fetch('/api/current-user', {
        method: 'GET',
        credentials: 'include',  // 携带cookie（关键，保证session有效）
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 401) {
            // 未登录，跳转到登录页
            window.location.href = '/';
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.data) {
            // 渲染用户信息到页面
            renderUserInfo(data.data);
        } else {
            alert('获取用户信息失败：' + (data.msg || '未知错误'));
        }
    })
    .catch(error => {
        console.error('请求用户信息失败：', error);
        alert('获取用户信息失败，请刷新页面重试');
    });
}

// 渲染用户信息到页面
function renderUserInfo(user) {
    // 左侧信息
    document.getElementById('user-avatar').src = user.avatar;
    document.getElementById('user-nickname').textContent = user.nickname;
    document.getElementById('user-id').textContent = `ID: ${user.userId}`;
    document.getElementById('user-role').textContent = user.role;
    document.getElementById('user-score').textContent = user.score;
    document.getElementById('score-progress').style.width = `${user.score}%`;

    // 右侧资料信息
    document.getElementById('user-realname').textContent = user.realName;
    document.getElementById('user-jobnumber').textContent = user.jobNumber;
    document.getElementById('user-bio-verify').innerHTML =
        `<span class="iconify text-green-400" data-icon="solar:fingerprint-bold"></span> ${user.bioVerify}`;
    document.getElementById('user-auth').textContent = user.auth;
    document.getElementById('user-phone').textContent = user.phone;
    document.getElementById('user-email').textContent = user.email;
}

// 退出登录功能
function logout() {
    if (confirm('确定要退出登录吗？')) {
        fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/';
            } else {
                alert('退出登录失败：' + data.msg);
            }
        })
        .catch(error => {
            console.error('退出登录失败：', error);
            alert('退出登录失败，请刷新页面重试');
        });
    }
}
// 打开编辑弹窗
function openEditModal() {
    document.getElementById('edit_nickname').value = document.getElementById('user-nickname').innerText;
    document.getElementById('edit_realname').value = document.getElementById('user-realname').innerText;
    document.getElementById('edit_phone').value = document.getElementById('user-phone').innerText;
    document.getElementById('edit_email').value = document.getElementById('user-email').innerText;
    document.getElementById('editModal').style.display = 'flex';
}

// 关闭编辑弹窗
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// 保存用户信息
function saveUserInfo() {
    let data = {
        nickname: document.getElementById('edit_nickname').value,
        realName: document.getElementById('edit_realname').value,
        phone: document.getElementById('edit_phone').value,
        email: document.getElementById('edit_email').value
    };

    fetch('/api/update-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('保存成功！');
            closeEditModal();
            fetchCurrentUserInfo(); // 刷新页面显示
        } else {
            alert('保存失败：' + data.msg);
        }
    });
}

// 加载登录日志
function loadLoginLogs() {
    fetch('/api/login-logs', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) return;
        let html = '';
        data.data.forEach(log => {
            html += `
            <div class="flex justify-between p-2 border-b border-slate-800">
                <span class="text-cyan-400">${log.time}</span>
                <span class="text-slate-300">${log.location} - ${log.ip}</span>
                <span class="text-green-500">${log.type}</span>
            </div>`;
        });
        document.getElementById('login-logs-container').innerHTML = html;
    });
}

// 在页面加载时调用
document.addEventListener('DOMContentLoaded', function() {
    fetchCurrentUserInfo();
    loadLoginLogs();  // ← 加上这一行
});

// ================== 安全管理/修改密码 ==================
// 显示安全面板（隐藏资料面板）
function showSecurityPanel() {
    document.getElementById('security-panel').classList.remove('hidden');
    document.querySelector('.glass-panel.rounded-xl.p-8').classList.add('hidden');
    document.querySelector('.glass-panel.rounded-xl.p-6').classList.add('hidden');
}

// 显示资料面板（隐藏安全面板）
function showProfilePanel() {
    document.getElementById('security-panel').classList.add('hidden');
    document.querySelector('.glass-panel.rounded-xl.p-8').classList.remove('hidden');
    document.querySelector('.glass-panel.rounded-xl.p-6').classList.remove('hidden');
}

// 提交修改密码
function submitChangePassword() {
    let oldPwd = document.getElementById('old-pwd').value.trim();
    let newPwd = document.getElementById('new-pwd').value.trim();
    let confirmPwd = document.getElementById('confirm-pwd').value.trim();

    if (!oldPwd || !newPwd || !confirmPwd) {
        alert('请填写完整信息');
        return;
    }
    if (newPwd !== confirmPwd) {
        alert('两次输入的新密码不一致');
        return;
    }
    if (newPwd.length < 6) {
        alert('密码长度至少6位');
        return;
    }

    fetch('/api/update-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            oldPassword: oldPwd,
            newPassword: newPwd,
            confirmPassword: confirmPwd
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.msg);
            // 密码修改成功，退出登录
            logout();
        } else {
            alert('修改失败：' + data.msg);
        }
    })
    .catch(err => {
        console.error(err);
        alert('网络错误，请重试');
    });
}

