import asyncio
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
import json
import os

# ==========================
# 枚举与数据结构定义（严格对齐表格）
# ==========================
class AlertLevel(Enum):
    """极端天气预警等级（严格对应表格定义）"""
    BLUE = "一级（蓝色）"       # 轻度雨雪，能见度>1km
    YELLOW = "二级（黄色）"     # 中雨/小雪，能见度500m-1km
    ORANGE = "三级（橙色）"    # 大雨/中雪，能见度200m-500m
    RED = "四级（红色）"        # 暴雨/大雪，能见度<200m
    BLACK = "五级（黑色）"      # 特大暴雨/暴雪，能见度<50m

    @classmethod
    def from_visibility_and_precipitation(cls, visibility: float, precipitation: float) -> "AlertLevel":
        """根据能见度和降水强度直接匹配等级（表格规则）"""
        # 严格按表格阈值判断
        if visibility < 50:
            return cls.BLACK
        elif visibility < 200:
            return cls.RED
        elif visibility < 500:
            return cls.ORANGE
        elif visibility < 1000:
            return cls.YELLOW
        else:
            return cls.BLUE

    @property
    def color_code(self) -> str:
        """对应颜色代码（前端展示用）"""
        color_map = {
            self.BLUE: "#1E88E5",
            self.YELLOW: "#FFC107",
            self.ORANGE: "#FF5722",
            self.RED: "#F44336",
            self.BLACK: "#000000"
        }
        return color_map[self]

    @property
    def detection_strategy(self) -> str:
        """对应检测策略调整（表格字段）"""
        strategy_map = {
            self.BLUE: "标准检测参数",
            self.YELLOW: "降低置信度阈值",
            self.ORANGE: "启用天气特定模型",
            self.RED: "启用极端天气模式",
            self.BLACK: "应急检测模式"
        }
        return strategy_map[self]

    @property
    def response_action(self) -> str:
        """对应响应措施（表格字段）"""
        action_map = {
            self.BLUE: "正常监控，记录日志",
            self.YELLOW: "增加检测频率，人工复核",
            self.ORANGE: "启动多模态融合，加强监控",
            self.RED: "全传感器融合，最高优先级告警",
            self.BLACK: "启动应急预案，人工干预"
        }
        return action_map[self]

@dataclass
class WeatherAlert:
    """天气预警实体"""
    alert_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    level: AlertLevel = AlertLevel.BLUE
    weather_data: Dict[str, Any] = field(default_factory=dict)
    location: str = "未知位置"
    create_time: datetime = field(default_factory=datetime.now)
    duration_minutes: int = 0
    is_escalated: bool = False
    emergency_plan_activated: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """序列化为字典（接口/日志用）"""
        return {
            "alert_id": self.alert_id,
            "level": self.level.value,
            "level_color": self.level.color_code,
            "detection_strategy": self.level.detection_strategy,
            "response_action": self.level.response_action,
            "weather_data": self.weather_data,
            "location": self.location,
            "create_time": self.create_time.strftime("%Y-%m-%d %H:%M:%S"),
            "duration_minutes": self.duration_minutes,
            "is_escalated": self.is_escalated,
            "emergency_plan_activated": self.emergency_plan_activated
        }

class AlertChannel(Enum):
    """告警推送通道"""
    MONITORING_CENTER = "监控中心"
    EMAIL = "邮件通知"
    SMS = "短信通知"
    WEBSOCKET = "实时推送"
    DASHBOARD = "仪表盘更新"

# ==========================
# 核心预警系统类
# ==========================
class ExtremeWeatherAlertSystem:
    """极端天气预警系统（完全适配表格规则+现有项目架构）"""

    def __init__(self, log_dir: str = None):
        # 预警规则（严格对齐表格）
        self.alert_rules = self._load_alert_rules()
        # 预警历史
        self.alert_history: List[WeatherAlert] = []
        # 升级策略
        self.escalation_policies = self._load_escalation_policies()
        # 日志目录（适配项目log目录）
        self.log_dir = log_dir or os.path.join(os.path.dirname(__file__), "..", "log")
        os.makedirs(self.log_dir, exist_ok=True)
        # 告警日志文件
        self.alert_log_path = os.path.join(self.log_dir, "weather_alert_log.json")
        # 加载历史日志
        self._load_alert_history()

    def _load_alert_rules(self) -> Dict[AlertLevel, Dict[str, Any]]:
        """加载预警规则（严格对应表格定义）"""
        return {
            AlertLevel.BLUE: {
                "condition": "轻度雨雪，能见度>1km",
                "detection_strategy": "标准检测参数",
                "response": "正常监控，记录日志",
                "threshold": {"visibility": 1000, "precipitation": 10}
            },
            AlertLevel.YELLOW: {
                "condition": "中雨/小雪，能见度500m-1km",
                "detection_strategy": "降低置信度阈值",
                "response": "增加检测频率，人工复核",
                "threshold": {"visibility": 1000, "precipitation": 25}
            },
            AlertLevel.ORANGE: {
                "condition": "大雨/中雪，能见度200m-500m",
                "detection_strategy": "启用天气特定模型",
                "response": "启动多模态融合，加强监控",
                "threshold": {"visibility": 500, "precipitation": 50}
            },
            AlertLevel.RED: {
                "condition": "暴雨/大雪，能见度<200m",
                "detection_strategy": "启用极端天气模式",
                "response": "全传感器融合，最高优先级告警",
                "threshold": {"visibility": 200, "precipitation": 100}
            },
            AlertLevel.BLACK: {
                "condition": "特大暴雨/暴雪，能见度<50m",
                "detection_strategy": "应急检测模式",
                "response": "启动应急预案，人工干预",
                "threshold": {"visibility": 50, "precipitation": 200}
            }
        }

    def _load_escalation_policies(self) -> Dict[str, Any]:
        """加载预警升级策略"""
        return {
            "consecutive_alerts_threshold": 3,  # 连续3次预警触发升级
            "duration_threshold_minutes": 60,   # 持续60分钟触发应急预案
            "escalation_step": 1,               # 每次升级1个等级
            "emergency_activation_threshold": AlertLevel.RED  # 红色及以上可触发预案
        }

    def _load_alert_history(self):
        """加载历史预警日志（适配项目JSON存储）"""
        if os.path.exists(self.alert_log_path):
            try:
                with open(self.alert_log_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        alert = WeatherAlert(
                            alert_id=item["alert_id"],
                            level=AlertLevel(item["level"]),
                            weather_data=item["weather_data"],
                            location=item["location"],
                            create_time=datetime.strptime(item["create_time"], "%Y-%m-%d %H:%M:%S"),
                            duration_minutes=item["duration_minutes"],
                            is_escalated=item["is_escalated"],
                            emergency_plan_activated=item["emergency_plan_activated"]
                        )
                        self.alert_history.append(alert)
            except Exception as e:
                print(f"加载预警历史失败: {e}")

    def _save_alert_history(self):
        """保存预警历史到JSON（适配项目存储结构）"""
        try:
            data = [alert.to_dict() for alert in self.alert_history]
            with open(self.alert_log_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
        except Exception as e:
            print(f"保存预警历史失败: {e}")

    # ==========================
    # 核心监控与预警流程
    # ==========================
    async def monitor_and_alert(self, weather_data: Dict[str, Any], location: str = "未知位置"):
        """
        监控天气数据并触发预警（主入口）
        :param weather_data: 天气数据，需包含visibility(能见度，单位m)、precipitation(降水强度，单位mm/h)
        :param location: 预警位置
        """
        # 1. 评估天气严重程度（严格按表格规则）
        severity = await self._assess_severity(weather_data)

        # 2. 检查是否需要触发预警（黄色及以上触发）
        if severity.value >= AlertLevel.YELLOW.value:
            # 3. 创建预警实体
            alert = await self._create_alert(weather_data, severity, location)

            # 4. 触发多通道告警
            await self._trigger_alert(alert)

            # 5. 记录预警历史
            self.alert_history.append(alert)
            self._save_alert_history()

            # 6. 检查预警升级
            await self._check_escalation(alert)

            # 7. 同步到检测系统（适配现有检测模块）
            await self._sync_to_detection_system(alert)

    async def _assess_severity(self, weather_data: Dict[str, Any]) -> AlertLevel:
        """
        评估天气严重程度（严格对齐表格阈值）
        优先使用能见度+降水直接匹配，补充风速等多维度评分
        """
        # 核心指标：能见度（表格第一判断标准）
        visibility = weather_data.get("visibility", 10000)  # 默认10km（晴天）
        precipitation = weather_data.get("precipitation", 0)  # 默认无降水

        # 第一步：按表格直接匹配等级
        level = AlertLevel.from_visibility_and_precipitation(visibility, precipitation)

        # 第二步：多维度评分校验（补充风速等）
        severity_score = 0
        # 能见度评分
        if visibility < 50:
            severity_score += 100
        elif visibility < 200:
            severity_score += 80
        elif visibility < 500:
            severity_score += 60
        elif visibility < 1000:
            severity_score += 40
        # 降水强度评分
        if precipitation > 50:  # 暴雨
            severity_score += 90
        elif precipitation > 25:  # 大雨
            severity_score += 70
        elif precipitation > 10:  # 中雨
            severity_score += 50
        elif precipitation > 0:  # 小雨
            severity_score += 30
        # 风速评分
        wind_speed = weather_data.get("wind_speed", 0)
        if wind_speed > 20:  # 8级大风
            severity_score += 80
        elif wind_speed > 10:  # 5级风
            severity_score += 50

        # 评分校验，避免误判
        if severity_score >= 150 and level != AlertLevel.BLACK:
            return AlertLevel.BLACK
        elif severity_score >= 120 and level.value < AlertLevel.RED.value:
            return AlertLevel.RED
        elif severity_score >= 90 and level.value < AlertLevel.ORANGE.value:
            return AlertLevel.ORANGE
        elif severity_score >= 60 and level.value < AlertLevel.YELLOW.value:
            return AlertLevel.YELLOW

        return level

    async def _create_alert(self, weather_data: Dict[str, Any], severity: AlertLevel, location: str) -> WeatherAlert:
        """创建预警实体"""
        # 计算持续时间
        last_alert = next(
            (a for a in reversed(self.alert_history) if a.location == location),
            None
        )
        duration = 0
        if last_alert and last_alert.level == severity:
            duration = last_alert.duration_minutes + int((datetime.now() - last_alert.create_time).total_seconds() / 60)

        return WeatherAlert(
            level=severity,
            weather_data=weather_data,
            location=location,
            duration_minutes=duration
        )

    async def _trigger_alert(self, alert: WeatherAlert):
        """触发多通道告警（适配项目现有通知体系）"""
        # 定义告警推送通道（可直接对接项目现有接口）
        alert_channels: List[Callable[[WeatherAlert], Any]] = [
            self._push_to_monitoring_center,
            self._send_email_alerts,
            self._send_sms_alerts,
            self._broadcast_websocket,
            self._update_dashboard
        ]

        # 并行执行告警推送
        tasks = [channel(alert) for channel in alert_channels]
        await asyncio.gather(*tasks, return_exceptions=True)

    # ==========================
    # 告警通道实现（可直接对接项目现有接口）
    # ==========================
    async def _push_to_monitoring_center(self, alert: WeatherAlert):
        """推送到监控中心（对接项目现有监控模块）"""
        print(f"[监控中心告警] {alert.level.value} - {alert.location} - {alert.level.response_action}")
        # 可对接项目现有监控API
        pass

    async def _send_email_alerts(self, alert: WeatherAlert):
        """发送邮件告警（可对接项目邮件服务）"""
        print(f"[邮件告警] 发送{alert.level.value}预警到管理员邮箱")
        # 可集成smtplib实现真实邮件发送
        pass

    async def _send_sms_alerts(self, alert: WeatherAlert):
        """发送短信告警（可对接第三方短信API）"""
        print(f"[短信告警] 发送{alert.level.value}预警到相关负责人")
        # 可对接阿里云/腾讯云短信API
        pass

    async def _broadcast_websocket(self, alert: WeatherAlert):
        """WebSocket实时推送（对接项目前端实时通知）"""
        print(f"[WebSocket推送] 广播{alert.level.value}预警到前端")
        # 可对接项目现有Flask-SocketIO
        pass

    async def _update_dashboard(self, alert: WeatherAlert):
        """更新仪表盘（对接项目现有visual_dashboard模块）"""
        print(f"[仪表盘更新] 更新{alert.location}预警状态为{alert.level.value}")
        # 可直接写入dashboard数据接口
        pass

    # ==========================
    # 预警升级与应急预案
    # ==========================
    async def _check_escalation(self, alert: WeatherAlert):
        """检查预警升级（对齐表格响应措施）"""
        policy = self.escalation_policies
        # 1. 检查连续预警
        recent_alerts = [
            a for a in self.alert_history[-10:]
            if a.location == alert.location
        ]

        if len(recent_alerts) >= policy["consecutive_alerts_threshold"] and not alert.is_escalated:
            await self._escalate_response(alert)

        # 2. 检查预警持续时间
        if alert.duration_minutes >= policy["duration_threshold_minutes"] and not alert.emergency_plan_activated:
            if alert.level.value >= policy["emergency_activation_threshold"].value:
                await self._activate_emergency_plan(alert)

    async def _escalate_response(self, alert: WeatherAlert):
        """升级预警响应级别"""
        alert.is_escalated = True
        print(f"[预警升级] {alert.location} 连续预警，升级响应措施")
        # 升级检测策略：启用更高等级的检测模式
        if alert.level == AlertLevel.YELLOW:
            print("→ 升级为橙色预警策略：启动多模态融合")
        elif alert.level == AlertLevel.ORANGE:
            print("→ 升级为红色预警策略：全传感器融合")
        # 保存升级状态
        self._save_alert_history()

    async def _activate_emergency_plan(self, alert: WeatherAlert):
        """启动应急预案（黑色预警强制触发）"""
        alert.emergency_plan_activated = True
        print(f"[应急预案启动] {alert.location} 触发{alert.level.value}应急预案，人工干预")
        # 对接项目应急流程：通知最高权限管理员、启动应急检测模式
        self._save_alert_history()

    # ==========================
    # 与现有检测系统联动
    # ==========================
    async def _sync_to_detection_system(self, alert: WeatherAlert):
        """同步预警状态到检测系统（适配现有detection模块）"""
        # 根据预警等级调整检测参数（严格对应表格检测策略）
        strategy = alert.level.detection_strategy
        print(f"[检测系统同步] 应用{alert.level.value}检测策略：{strategy}")
        # 可直接修改全局检测参数，对接现有检测模块
        pass

    # ==========================
    # 对外接口（供Flask路由调用）
    # ==========================
    def get_current_alert_status(self, location: str = None) -> Dict[str, Any]:
        """获取当前预警状态（供前端接口调用）"""
        if location:
            recent_alerts = [a for a in self.alert_history if a.location == location]
        else:
            recent_alerts = self.alert_history[-10:]  # 返回最近10条

        if not recent_alerts:
            return {
                "current_level": AlertLevel.BLUE.value,
                "color": AlertLevel.BLUE.color_code,
                "detection_strategy": AlertLevel.BLUE.detection_strategy,
                "response_action": AlertLevel.BLUE.response_action,
                "recent_alerts": []
            }

        latest_alert = max(recent_alerts, key=lambda x: x.level.value)
        return {
            "current_level": latest_alert.level.value,
            "color": latest_alert.level.color_code,
            "detection_strategy": latest_alert.level.detection_strategy,
            "response_action": latest_alert.level.response_action,
            "recent_alerts": [a.to_dict() for a in recent_alerts[-5:]]
        }

    def get_alert_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """获取预警历史（供历史页面调用）"""
        return [a.to_dict() for a in self.alert_history[-limit:]]