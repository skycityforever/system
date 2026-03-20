import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import pytest
# 修正导入路径：直接从 data_transport.device_transport 导入
from ..data_transport.device_transport import save_device_to_json, DEVICE_LOG_FILE
from ..data_transport.device_transport import device_transport_bp  # 若需要测试接口

# --------------------------
# 1. 数据传输模块测试（适配你的 save_device_to_json 实现）
# --------------------------
class TestDeviceTransport:
    def setup_method(self):
        """测试前初始化：备份原始数据，清空日志文件"""
        self.backup_data = []
        # 备份原始数据
        if os.path.exists(DEVICE_LOG_FILE):
            with open(DEVICE_LOG_FILE, 'r', encoding='utf-8') as f:
                self.backup_data = json.load(f)
        # 清空日志文件，写入空列表
        with open(DEVICE_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=4)

    def teardown_method(self):
        """测试后恢复原始数据"""
        with open(DEVICE_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.backup_data, f, ensure_ascii=False, indent=4)

    def test_save_new_device(self):
        """测试保存新设备到 devices.json"""
        new_device = {
            "device_id": "TEST-001",
            "status": "online",
            "ip": "192.168.1.100",
            "location": "测试区",
            "environment": "extreme_cold",
            "temperature": 42.5,
            "cpu_load": 12.0,
            "signal_strength": 98
        }
        result = save_device_to_json(new_device)
        assert result is True  # 验证保存成功

        # 验证文件内容
        with open(DEVICE_LOG_FILE, 'r', encoding='utf-8') as f:
            devices = json.load(f)
        assert len(devices) == 1
        assert devices[0]["device_id"] == "TEST-001"
        assert "submit_time" in devices[0]  # 验证自动添加了提交时间
        assert devices[0]["id"] == 1  # 验证自动生成了ID

    def test_save_multiple_devices(self):
        """测试多次保存，验证追加逻辑"""
        device1 = {"device_id": "TEST-001", "status": "online"}
        device2 = {"device_id": "TEST-002", "status": "offline"}
        save_device_to_json(device1)
        save_device_to_json(device2)

        with open(DEVICE_LOG_FILE, 'r', encoding='utf-8') as f:
            devices = json.load(f)
        assert len(devices) == 2
        assert devices[1]["id"] == 2  # 验证ID自增

# --------------------------
# 2. 页面功能集成测试（Selenium）
# --------------------------
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class TestDevicePage:
    def setup_method(self):
        """启动浏览器，打开设备管理页面"""
        self.driver = webdriver.Chrome()  # 需提前安装 ChromeDriver
        self.driver.get("http://localhost:5000/edge_device_management")  # 替换为你的页面地址
        self.driver.maximize_window()
        self.wait = WebDriverWait(self.driver, 10)

    def teardown_method(self):
        """关闭浏览器"""
        self.driver.quit()

    def test_page_load(self):
        """测试页面加载"""
        title = self.driver.title
        assert "极境守护" in title
        # 验证统计栏显示
        online_stat = self.driver.find_element(By.ID, "onlineStat").text
        assert "在线" in online_stat
        # 验证设备卡片存在
        device_cards = self.driver.find_elements(By.CLASS_NAME, "device-card")
        assert len(device_cards) > 0

    def test_sidebar_open(self):
        """测试点击设备卡片打开侧边栏"""
        first_card = self.driver.find_element(By.CLASS_NAME, "device-card")
        first_card.click()
        # 等待侧边栏打开
        sidebar = self.wait.until(EC.visibility_of_element_located((By.ID, "deviceSidebar")))
        assert "open" in sidebar.get_attribute("class")
        # 验证侧边栏设备ID显示
        sidebar_title = self.driver.find_element(By.ID, "sidebarDeviceTitle").text
        assert len(sidebar_title) > 0

    def test_alert_notification(self):
        """测试告警通知弹出"""
        # 等待告警出现（页面会定时推送）
        alert = self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "alert-item")))
        assert alert.is_displayed()
        assert "告警" in alert.text or "警告" in alert.text

    def test_fix_error_flow(self):
        """测试排查故障流程"""
        fix_btn = self.driver.find_element(By.CLASS_NAME, "fix-error-btn")
        fix_btn.click()
        # 等待按钮变为"处理中"
        self.wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "fix-error-btn"), "处理中"))
        # 等待处理完成，按钮恢复
        self.wait.until_not(EC.text_to_be_present_in_element((By.CLASS_NAME, "fix-error-btn"), "处理中"))
        # 验证状态更新为在线
        status_badge = self.driver.find_element(By.XPATH, "//span[contains(text(), 'Stable')]")
        assert status_badge.is_displayed()

if __name__ == "__main__":
    pytest.main(["-v", "test_device_system.py"])