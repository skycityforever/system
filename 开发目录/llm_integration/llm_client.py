# -*- coding: utf-8 -*-
"""
LLM 集成模块 - 豆包大模型调用
功能：
1. 接收图片路径/Base64 + 场景上下文
2. 生成标准化提示词，调用豆包API
3. 解析返回结果：极端环境类型、人数、防护建议
4. 提供给目标检测模块调用
5. 新增雾天识别 + 本地静态建议兜底（大模型调用失败时使用）
"""

import json
import requests
import base64
from typing import Dict, Optional, Tuple


class DoubaoEnvironmentAnalyzer:
    # 本地静态防护建议列表（兜底用）
    LOCAL_PROTECTION_SUGGESTIONS = {
        "暴雨": [
            "穿戴防水冲锋衣、防水鞋套，佩戴防雾护目镜",
            "避免在低洼处作业，远离电线、广告牌等易坠物",
            "若遇雷电天气，立即停止户外作业，前往就近避雷场所"
        ],
        "下雪/暴雪": [
            "穿戴加绒防水防寒服，佩戴防滑冰爪鞋套",
            "作业前清理设备表面积雪，防止结冰影响操作",
            "每30分钟进入温暖区域休息，避免冻伤"
        ],
        "弱光/夜间/低能见度": [
            "佩戴高亮反光背心，使用防爆强光手电照明",
            "减少单人作业，保持团队间距不超过5米",
            "提前规划作业路线，避开无照明危险区域"
        ],
        "大风/沙尘暴": [
            "佩戴防风沙面罩、护目镜，扎紧衣物防止进沙",
            "远离广告牌、塔吊等高空易坠物，选择背风处作业",
            "沙尘暴天气下立即停止户外作业，进入密闭空间"
        ],
        "雾天": [
            "佩戴防雾护目镜，使用车载/手持雾天警示灯",
            "作业速度降低50%，保持1米内可视距离作业",
            "雾浓度超过50米能见度时，立即停止户外作业"
        ],
        "复杂混合天气": [
            "穿戴复合防护装备（如防水+防寒+防风）",
            "指派专人观察环境变化，实时预警风险",
            "缩短单次作业时长，每15分钟轮换休息"
        ],
        "正常环境": [
            "穿戴常规劳保用品，按标准流程作业",
            "定时检查设备运行状态，确保通讯畅通",
            "保持作业区域整洁，避免无关杂物堆积"
        ]
    }

    def __init__(self, api_url: str, api_key: str):
        """
        初始化豆包客户端
        :param api_url: 豆包大模型接口地址
        :param api_key: 接口鉴权密钥
        """
        self.api_url = api_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def build_prompt(self, image_desc: Optional[str] = None) -> str:
        """
        构建标准化提示词（核心逻辑，新增雾天识别）
        :param image_desc: 图片的文本描述（可选，目标检测模块可传入初步识别结果）
        :return: 完整提示词
        """
        base_prompt = """
你是一个极端环境视觉分析专家，请根据提供的图片，完成以下分析任务：

1. **极端恶劣环境识别**：判断图片属于以下哪种环境：
   - 暴雨
   - 下雪/暴雪
   - 弱光/夜间/低能见度
   - 大风/沙尘暴
   - 雾天
   - 复杂混合天气（同时存在多种恶劣条件）
   - 正常环境（无极端天气）

2. **人数统计**：准确识别图片中出现的**总人数**（包括清晰可见和部分遮挡的人员）

3. **防护建议**：针对识别出的极端环境，给出面向户外作业/巡检人员的**可执行防护建议**，包括：
   - 装备防护（衣物、护具）
   - 操作安全注意事项
   - 应急处置措施

请严格按照以下 JSON 格式输出结果，不要添加额外说明：
{
  "environment_type": "环境类型",
  "person_count": 人数（整数）,
  "protection_suggestions": [
    "建议1",
    "建议2",
    "建议3"
  ]
}
"""
        if image_desc:
            base_prompt += f"\n\n补充图片描述：{image_desc}"
        return base_prompt.strip()

    def get_local_fallback_result(self, image_desc: Optional[str] = None) -> Dict:
        """
        本地兜底结果生成（大模型调用失败时使用）
        :param image_desc: 图片描述，用于粗略判断环境类型
        :return: 兜底分析结果
        """
        # 简单的关键词匹配判断环境类型
        env_type = "正常环境"
        if image_desc:
            desc_lower = image_desc.lower()
            if "雾" in desc_lower or "雾霾" in desc_lower:
                env_type = "雾天"
            elif "雨" in desc_lower or "积水" in desc_lower:
                env_type = "暴雨"
            elif "雪" in desc_lower or "暴雪" in desc_lower:
                env_type = "下雪/暴雪"
            elif "风" in desc_lower or "沙" in desc_lower:
                env_type = "大风/沙尘暴"
            elif "暗" in desc_lower or "弱光" in desc_lower or "夜间" in desc_lower:
                env_type = "弱光/夜间/低能见度"
            elif any(word in desc_lower for word in ["雨", "雪", "风", "雾"]) and len(
                    [w for w in ["雨", "雪", "风", "雾"] if w in desc_lower]) >= 2:
                env_type = "复杂混合天气"

        return {
            "environment_type": env_type,
            "person_count": 0,  # 本地无法统计人数，默认0
            "protection_suggestions": self.LOCAL_PROTECTION_SUGGESTIONS[env_type]
        }

    def analyze_image(
            self,
            image_base64: Optional[str] = None,
            image_path: Optional[str] = None,
            image_desc: Optional[str] = None
    ) -> Dict:
        """
        调用豆包大模型分析图片（新增兜底逻辑）
        :param image_base64: 图片Base64编码（二选一传入）
        :param image_path: 图片本地路径（二选一传入）
        :param image_desc: 图片文本描述（可选，目标检测模块传入）
        :return: 分析结果（JSON格式）
        """
        try:
            # 构建提示词
            prompt = self.build_prompt(image_desc)

            # 构建请求 payload（根据豆包API格式调整）
            payload = {
                "model": "doubao-pro",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                        ]
                    }
                ]
            }

            # 如果传入图片，添加图片内容
            if image_base64:
                payload["messages"][0]["content"].append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                })
            elif image_path:
                # 读取图片并转Base64
                with open(image_path, "rb") as f:
                    image_base64 = base64.b64encode(f.read()).decode("utf-8")
                payload["messages"][0]["content"].append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                })

            # 发送请求
            response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()

            # 解析返回结果
            llm_output = result["choices"][0]["message"]["content"]
            json_start = llm_output.find("{")
            json_end = llm_output.rfind("}") + 1
            analysis_result = json.loads(llm_output[json_start:json_end])

            # 补充：如果LLM返回的建议为空，使用本地建议兜底
            if not analysis_result.get("protection_suggestions"):
                env_type = analysis_result.get("environment_type", "正常环境")
                analysis_result["protection_suggestions"] = self.LOCAL_PROTECTION_SUGGESTIONS.get(env_type,
                                                                                                  self.LOCAL_PROTECTION_SUGGESTIONS[
                                                                                                      "正常环境"])

            return analysis_result

        except Exception as e:
            print(f"大模型调用失败：{str(e)}，使用本地兜底结果")
            # 调用失败时返回本地兜底结果
            return self.get_local_fallback_result(image_desc)

    def get_prompt_list(self) -> Dict[str, str]:
        """
        提供提示词列表，供目标检测模块直接调用（新增雾天相关提示词）
        :return: 不同场景的提示词模板
        """
        return {
            "environment_analysis": self.build_prompt(),
            "person_count": """请准确统计图片中出现的总人数，包括部分遮挡的人员，仅返回数字""",
            "protection_suggestion": """根据图片中的极端环境（暴雨/下雪/弱光/大风/雾天/复杂混合天气），给出面向户外作业人员的3条可执行防护建议""",
            "fog_detection": """判断图片是否为雾天环境，仅返回“是”或“否”"""
        }


# --------------------------
# 示例：模块调用方式
# --------------------------
if __name__ == "__main__":
    # 初始化（实际使用时从配置文件读取）
    analyzer = DoubaoEnvironmentAnalyzer(
        api_url="https://metaso.cn/api/v1/chat/completions",
        api_key="mk-7925AE7CBDE52565CD3535FECAAC9172"
    )

    # 调用示例（传入图片路径+描述）
    try:
        result = analyzer.analyze_image(
            image_path="8.png",
            image_desc="户外巡检场景，大雾天气，能见度不足10米，地面有薄霜"
        )
        print("分析结果：")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"分析失败：{str(e)}")