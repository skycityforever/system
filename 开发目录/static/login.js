// ==========================
// 基础错误提示功能
// ==========================
// 显示通用登录错误提示
function showError() {
    document.getElementById('loginError').style.display = 'block';
    // 3秒后自动隐藏
    setTimeout(() => {
        document.getElementById('loginError').style.display = 'none';
    }, 3000);
}

// 隐藏错误提示（输入框聚焦时清空提示）
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('username')?.addEventListener('focus', function() {
        document.getElementById('loginError').style.display = 'none';
    });
    document.getElementById('password')?.addEventListener('focus', function() {
        document.getElementById('loginError').style.display = 'none';
    });
});

// ==========================
// 验证码核心功能
// ==========================
class VerifyCode {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 120;
        this.canvas.height = 40;
        this.ctx = this.canvas.getContext('2d');
        this.code = ''; // 存储后端生成的验证码
        this.charSet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // 验证码字符集
    }

    // 绘制验证码图片（基于传入的code）
    drawCode() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景（随机颜色+噪点）
        this.ctx.fillStyle = `rgba(${Math.random()*50+200}, ${Math.random()*50+200}, ${Math.random()*50+200}, 0.8)`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制干扰线
        for (let i = 0; i < 5; i++) {
            this.ctx.strokeStyle = `rgba(${Math.random()*100}, ${Math.random()*100}, ${Math.random()*100}, 0.6)`;
            this.ctx.beginPath();
            this.ctx.moveTo(Math.random()*this.canvas.width, Math.random()*this.canvas.height);
            this.ctx.lineTo(Math.random()*this.canvas.width, Math.random()*this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制干扰点
        for (let i = 0; i < 30; i++) {
            this.ctx.fillStyle = `rgba(${Math.random()*100}, ${Math.random()*100}, ${Math.random()*100}, 0.8)`;
            this.ctx.beginPath();
            this.ctx.arc(Math.random()*this.canvas.width, Math.random()*this.canvas.height, 1, 0, 2*Math.PI);
            this.ctx.fill();
        }

        // 绘制验证码字符
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let i = 0; i < this.code.length; i++) {
            // 每个字符随机颜色、旋转角度
            this.ctx.fillStyle = `rgba(${Math.random()*80}, ${Math.random()*80}, ${Math.random()*80}, 1)`;
            this.ctx.save();
            this.ctx.translate(20 + i*25, 20); // 字符位置
            this.ctx.rotate((Math.random() - 0.5) * 0.4); // 随机旋转
            this.ctx.fillText(this.code[i], 0, 0);
            this.ctx.restore();
        }

        return this.canvas.toDataURL(); // 返回图片Base64
    }

    // 验证输入的验证码是否正确
    checkCode(inputCode) {
        return inputCode.toUpperCase() === this.code.toUpperCase(); // 不区分大小写
    }
}

// 初始化验证码对象
let verifyCode = new VerifyCode();

// ==========================
// 验证码刷新函数（核心：调用后端接口生成验证码）
// ==========================
async function refreshCode() {
    try {
        // 调用后端验证码生成接口
        const response = await fetch('/api/generate-code', {
            method: 'GET',
            credentials: 'include' // 关键：携带Cookie，保证Session一致
        });
        const result = await response.json();

        if (result.success) {
            verifyCode.code = result.code; // 存储后端生成的验证码
            // 绘制验证码图片
            document.getElementById('codeImage').innerHTML = `<img src="${verifyCode.drawCode()}" alt="验证码" style="width: 120px; height: 40px;">`;
        } else {
            alert('验证码生成失败，请刷新页面重试');
        }
    } catch (error) {
        console.error('获取验证码失败:', error);
        alert('网络错误，验证码加载失败');
    }
}

// ==========================
// 登录错误提示功能（细化）
// ==========================
// 显示登录错误提示
function showLoginError() {
    document.getElementById('loginError').style.display = 'block';
    // 3秒后自动隐藏
    setTimeout(() => {
        document.getElementById('loginError').style.display = 'none';
    }, 3000);
}

// 显示验证码错误提示
function showCodeError() {
    document.getElementById('codeError').style.display = 'block';
    // 3秒后自动隐藏
    setTimeout(() => {
        document.getElementById('codeError').style.display = 'none';
    }, 3000);
}

// ==========================
// 页面加载完成后初始化
// ==========================
document.addEventListener('DOMContentLoaded', function() {
    // 1. 精准定位密码输入框的父容器，将验证码插入到密码框下方
    const passwordInput = document.getElementById('password');
    let passwordDiv = null;

    // 优先找密码输入框的直接父容器（.mb-4），如果找不到则找密码框本身
    if (passwordInput) {
        passwordDiv = passwordInput.closest('.mb-4') || passwordInput.parentElement;
    }

    // 兼容处理：如果没找到密码框，再找class为mb-4的第二个元素（通常账号是第一个，密码是第二个）
    if (!passwordDiv) {
        const mb4Elements = document.querySelectorAll('.mb-4');
        passwordDiv = mb4Elements.length >= 2 ? mb4Elements[1] : (mb4Elements[0] || null);
    }

    if (passwordDiv) {
        const codeDiv = document.createElement('div');
        codeDiv.className = 'mb-4'; // 保持和账号/密码框一致的间距样式
        codeDiv.innerHTML = `
            <label class="form-label">验证码</label>
            <div class="d-flex align-items-center gap-2">
                <input type="text" class="form-control" name="verifyCode" id="verifyCode" placeholder="请输入验证码" required style="flex: 1;">
                <div id="codeImage" style="cursor: pointer; border: 1px solid #ddd; border-radius: 4px;"></div>
            </div>
            <div class="login-error" id="codeError" style="display: none; color: red; font-size: 12px; margin-top: 5px;">验证码错误</div>
        `;
        // 插入到密码框父容器的后面（即账号→密码→验证码的顺序）
        passwordDiv.after(codeDiv);

        // 2. 初始化验证码图片
        refreshCode();

        // 3. 点击验证码图片刷新
        document.getElementById('codeImage').addEventListener('click', refreshCode);

        // 4. 验证码输入框聚焦时隐藏错误提示
        document.getElementById('verifyCode').addEventListener('focus', function() {
            document.getElementById('codeError').style.display = 'none';
        });
    }

    // 初始化登录错误提示元素（防止不存在）
    if (!document.getElementById('loginError')) {
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'loginError';
            errorDiv.style.display = 'none';
            errorDiv.style.color = 'red';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.marginTop = '5px';
            errorDiv.textContent = '账号或密码错误';
            // 将错误提示插入到验证码框下方（如果有），否则插入到表单末尾
            const codeDiv = document.querySelector('.mb-4:last-child');
            if (codeDiv) {
                codeDiv.after(errorDiv);
            } else {
                loginForm.appendChild(errorDiv);
            }
        }
    }

    // 隐藏所有错误提示（输入框聚焦时）
    document.getElementById('username')?.addEventListener('focus', function() {
        document.getElementById('loginError').style.display = 'none';
    });
    document.getElementById('password')?.addEventListener('focus', function() {
        document.getElementById('loginError').style.display = 'none';
    });

    // ==========================
    // 原生JS登录逻辑（主逻辑）
    // ==========================
    document.getElementById('loginFormElement')?.addEventListener('submit', async function(e) {
        e.preventDefault(); // 阻止默认表单提交

        // 获取输入值
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const inputCode = document.getElementById('verifyCode').value.trim();

        // 1. 前端初步验证验证码（空值校验）
        if (!inputCode) {
            showCodeError();
            document.getElementById('codeError').textContent = '请输入验证码';
            return;
        }

        // 2. 前端验证验证码正确性（可选，后端会二次验证）
        if (!verifyCode.checkCode(inputCode)) {
            showCodeError();
            refreshCode(); // 刷新验证码
            return;
        }

        // 3. 调用后端登录接口（携带验证码）
        try {
            const response = await fetch('/api/verify-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // 关键：携带Cookie（Session）
                body: JSON.stringify({
                    username: username,
                    password: password,
                    verifyCode: inputCode // 新增：传递验证码给后端
                })
            });

            const result = await response.json();

            if (result.success) {
                // 登录成功，跳转到导航页
                window.location.href = '/navgation';
            } else {
                // 登录失败，显示对应提示
                if (result.msg.includes('验证码')) {
                    showCodeError();
                    document.getElementById('codeError').textContent = result.msg;
                } else {
                    showLoginError();
                    document.getElementById('loginError').textContent = result.msg || '账号或密码错误';
                }
                refreshCode(); // 刷新验证码
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            showLoginError(); // 网络错误也显示提示
            document.getElementById('loginError').textContent = '网络错误，请检查连接';
            refreshCode(); // 刷新验证码
        }
    });
});

// ==========================
// jQuery版本登录/登出逻辑（备用，需引入jQuery）
// ==========================
$(document).ready(function() {
    // 登录逻辑
    $('#loginFormElement').on('submit', function(e) {
        e.preventDefault();
        const username = $('#username').val().trim();
        const password = $('#password').val().trim();
        const inputCode = $('#verifyCode').val().trim();

        // 1. 验证码验证（空值+正确性）
        if (!inputCode) {
            showCodeError();
            $('#codeError').text('请输入验证码');
            return;
        }
        if (!verifyCode.checkCode(inputCode)) {
            showCodeError();
            refreshCode();
            return;
        }

        // 2. 账号密码验证（调用后端接口）
        $.ajax({
            url: '/api/verify-login',
            type: 'POST',
            contentType: 'application/json',
            xhrFields: {
                withCredentials: true  // 携带Cookie
            },
            crossDomain: true,
            data: JSON.stringify({
                username: username,
                password: password,
                verifyCode: inputCode // 新增：传递验证码
            }),
            success: function(res) {
                if (res.success) {
                    alert('登录成功！');
                    window.location.href = '/navgation';
                } else {
                    if (res.msg.includes('验证码')) {
                        showCodeError();
                        $('#codeError').text(res.msg);
                    } else {
                        alert(res.msg || '账号或密码错误');
                        showLoginError();
                    }
                    refreshCode();
                }
            },
            error: function() {
                alert('登录失败，请检查网络！');
                showLoginError();
                refreshCode();
            }
        });
    });

    // 登出逻辑（导航页使用）
    $('#logoutBtn').on('click', function() {
        $.ajax({
            url: '/api/logout',
            type: 'POST',
            xhrFields: {
                withCredentials: true
            },
            crossDomain: true,
            success: function(res) {
                if (res.success) {
                    alert('登出成功！');
                    window.location.href = '/login.html';
                }
            },
            error: function() {
                alert('登出失败，请重试！');
            }
        });
    });
});