
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export async function* transformDailyReportStream(
  rawText: string, 
  columns: string[],
  templateHint: string
) {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("检测到未配置 API_KEY。请在 Zeabur 环境变量中添加 API_KEY 变量。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `
任务：将非结构化多人日报转换为飞书多维表格可用的TSV数据（不要表头）。

目标列顺序（严格按此顺序）：
${columns.map((col, i) => `${i + 1}. ${col}`).join('\n')}

执行准则（严禁违反）：
1. 【格式控制】禁止输出任何 Markdown 代码块标签（如 \`\`\`tsv 或 \`\`\`）。仅输出纯文本。
2. 【内容提取】从文本中识别所有人员，每人生成一行数据。
3. 【日期转换】所有日期必须格式化为 YYYY/MM/DD。
4. 【数值处理】所有数值列若无数据必须填数字 0。
5. 【分隔符】仅使用制表符（Tab）作为列分隔符。
6. 【纯净输出】禁止输出任何开场白、解释或结论。

背景规则：${templateHint}

待转换内容：
${rawText}
          `
        }]
      }],
      config: {
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    for await (const chunk of responseStream) {
      const text = (chunk as GenerateContentResponse).text;
      if (text) yield text;
    }
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "AI 引擎响应异常，请检查网络或密钥权限。");
  }
}
