// 注册表单核心逻辑
let isUsernameValid = false;

// 1. 账号验证 + 实时查重
$('#username').on('input blur', function() {
    const username = $(this).val().trim();
    const tip = $('#usernameTip');
    const reg = /^[0-9]{8,16}$/; // 8-16位纯数字

    // 空值校验
    if (!username) {
        tip.text('请输入账号').show();
        isUsernameValid = false;
        return;
    }

    // 格式校验
    if (!reg.test(username)) {
        tip.text('账号必须为8~16位纯数字').show();
        isUsernameValid = false;
        return;
    }

    // 后端查重（实时校验账号是否已存在）
    $.ajax({
        url: '../api/register/check',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ username: username }),
        success: function(res) {
            if (res.code === 200) {
                tip.hide();
                isUsernameValid = true;
            } else {
                tip.text('该账号已被注册').show();
                isUsernameValid = false;
            }
        },
        error: function(err) {
            // 兼容：后端查重接口未部署时，暂时跳过前端查重（后端最终校验）
            console.log('查重接口暂未部署，跳过前端查重');
            tip.hide();
            isUsernameValid = true;
        }
    });
});

// 2. 密码格式验证
$('#password').on('input blur', function() {
    const password = $(this).val().trim();
    const tip = $('#passwordTip');
    // 8-20位，必须包含数字+字母
    const reg = /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z]{8,20}$/;

    if (!password) {
        tip.text('请输入密码').show();
        return;
    }

    if (!reg.test(password)) {
        tip.text('密码必须为8~20位数字+字母组合').show();
        return;
    }

    tip.hide();
    checkRepassword(); // 密码合法后，同步校验确认密码
});

// 3. 确认密码验证
$('#repassword').on('input blur', checkRepassword);
function checkRepassword() {
    const password = $('#password').val().trim();
    const repassword = $('#repassword').val().trim();
    const tip = $('#repasswordTip');

    if (!repassword) {
        tip.text('请再次输入密码').show();
        return;
    }

    if (repassword !== password) {
        tip.text('两次输入的密码不一致').show();
        return;
    }

    tip.hide();
}

// 4. 邀请码验证（增强版）
$('#inviteCode').on('input blur', function() {
    const inviteCode = $(this).val().trim();
    const tip = $('#inviteCodeTip');

    // 为空不校验
    if (!inviteCode) {
        tip.hide();
        return;
    }

    // 不为空 → 前端预校验（后端也会再校验）
    const CORRECT_INVITE = "POLAR_GUARD_SUCESS";
    if (inviteCode !== CORRECT_INVITE) {
        tip.text('邀请码输入错误').show();
    } else {
        tip.hide();
    }
});

// 5. 表单提交核心逻辑
$('#registerForm').on('submit', function(e) {
    // 阻止表单默认刷新行为
    e.preventDefault();

    // 触发所有表单项的失焦验证（确保所有校验都执行）
    $('#username, #password, #repassword, #inviteCode').blur();

    // 获取表单数据
    const username = $('#username').val().trim();
    const password = $('#password').val().trim();
    const repassword = $('#repassword').val().trim();
    const inviteCode = $('#inviteCode').val().trim();

    // 最终校验（兜底）
    let isFormValid = true;
    if (!isUsernameValid) {
        $('#usernameTip').text('请输入有效的账号').show();
        isFormValid = false;
    }
    if (!/^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z]{8,20}$/.test(password)) {
        $('#passwordTip').text('请输入符合要求的密码').show();
        isFormValid = false;
    }
    if (repassword !== password) {
        $('#repasswordTip').text('两次输入的密码不一致').show();
        isFormValid = false;
    }
    if (!inviteCode) {
        $('#inviteCodeTip').text('请输入邀请码').show();
        isFormValid = false;
    }

    // 校验不通过则终止提交
    if (!isFormValid) return;

    // 构造提交数据
    const userData = {
        username: username,
        password: password,
        inviteCode: inviteCode
    };

    // 调用后端注册接口
    $.ajax({
        url: '../api/register',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userData),
        success: function(res) {
            if (res.code === 200) {
                alert('注册成功！即将跳转到登录页');
                window.location.href = '/'; // 跳转到登录页
            } else {
                alert('注册失败：' + res.msg); // 后端返回的错误信息
            }
        },
        error: function(xhr, status, error) {
            // 网络/服务器错误处理
            console.error('注册接口请求失败：', error);
            alert('注册失败，服务器连接异常！');
        }
    });
});