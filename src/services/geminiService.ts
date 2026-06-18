import { TableConfig } from "../types";

export async function processChatCommand(
  command: string, 
  currentConfig: TableConfig
): Promise<{ config: Partial<TableConfig>; message: string }> {
  // Try to access standard environment variable or fallback to the provided key
  const apiKey = process.env.BAILIAN_API_KEY || "sk-06ccf232096a43c699ace7eb0a12d380";

  const requestBody = {
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content: `你是一个专业的3D桌子配置助手，能够理解用户的自然语言输入并修改桌子参数。
桌子的结构为：桌面板(Top Panel) + 空心支撑框架(Sub-Frame) + 锥形桌腿(Tapered Legs)。

可修改的参数（及其单位和取值范围）：
- width: 宽度(cm)，范围[100-300]
- depth: 深度(cm)，范围[60-150]
- height: 高度(cm)，范围[50-110]
- legTaper: 腿部倾斜/倾角(cm)，范围[-20, 20]
- topThickness: 桌面厚度(mm)，范围[10-100]
- frameDepth: 框架垂直深度(mm)，范围[20-150]
- frameInwardOffset: 框架到边缘的缩进(mm)，范围[0-300]
- frameThickness: 框架横梁宽度(mm)，范围[20-200]，必须满足 >= legTopSize
- legTopSize: 桌腿顶部大小(mm)，范围[20-120]，必须满足 <= frameThickness
- legBottomSize: 桌腿底部大小(mm)，范围[10-100]
- legInnerDepth: 桌腿内侧探出框架的额外深度(mm)，范围[0-200]
- color: 十六进制颜色代码
- material: 材质，可选值为 "oak" (橡木), "steel" (钢材), "glass" (玻璃), "chrome" (镀铬), "marble" (大理石)
- chairId: 椅子ID，仅限 "CY-A1"
- chairMaterial: 椅子材质，可选值为 'titanium' (钛合金), 'fabric' (科技布)

椅子选择规则：
如果用户要求更换椅子，必须将 chairId 设置为 "CY-A1"，并同时从 ('titanium', 'fabric') 中随机选择一个 chairMaterial，作为配套的椅子配置。

几何约束规则（非必要时请保持框架厚度 >= 桌腿顶部大小）：
1. 框架厚度(frameThickness) 必须 >= 桌腿顶部大小(legTopSize)，防止桌腿渲染几何体溢出到支撑框架外。
2. (frameThickness + legInnerDepth) 必须比 legTopSize 大至少 5mm。
3. 框架缩进 + 框架厚度 + 桌腿内侧深度 必须小于桌子半轴尺寸的 45%，防止左右支撑在中心重叠。

你必须只返回一个合法的 JSON 对象，不包含任何 Markdown 代码块包裹，也不含任何多余文字。
JSON 对象格式要求：
{
  "config": {
    // 包含要修改的参数及其数值（仅包含被修改的部分，不要将所有参数全写进去，数字直接写数值不带单位）
  },
  "message": "在30-60字之间详细说明做出的调整，并向用户解释为何这样调整，用中文回复。"
}

示例回复：
{
  "config": {
    "width": 180,
    "color": "#3b2219"
  },
  "message": "已为您将桌子宽度调整为180cm，颜色更改为深棕红。"
}`
      },
      {
        role: "user",
        content: `当前配置: ${JSON.stringify(currentConfig)}\n用户指令: "${command}"`
      }
    ],
    response_format: { type: "json_object" }
  };

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };

  // List of candidate endpoints. 
  // 1. `/api/compatible-mode/v1/chat/completions` (Proxied in development and Vercel to bypass CORS)
  // 2. Direct Aliyun endpoint `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
  const endpoints = [
    "/api/compatible-mode/v1/chat/completions",
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
  ];

  let lastError: any = null;

  for (const url of endpoints) {
    try {
      console.log(`Trying to connect to DashScope API via: ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const textContent = data.choices?.[0]?.message?.content || "{}";
      
      // Robust JSON Parsing
      let cleanText = textContent.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();

      const result = JSON.parse(cleanText || "{}");
      return {
        config: result.config || {},
        message: result.message || "已经根据您的指令更新了桌子配置。"
      };
    } catch (err: any) {
      console.warn(`Connection failed for endpoint ${url}:`, err);
      lastError = err;
      // Continue to the next endpoint (direct call)
    }
  }

  // If both endpoints failed, raise the final error
  console.error("All DashScope API endpoints failed. Last error:", lastError);
  return {
    config: {},
    message: `无法连接到阿里云百炼服务（原因：${lastError?.message || "跨域限制或网络错误"}），请确保配置了正确的 API Key 并在支持的环境中运行。`
  };
}
