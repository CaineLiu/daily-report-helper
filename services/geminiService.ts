
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export async function* transformDailyReportStream(
  rawText: string, 
  columns: string[],
  templateHint: string
) {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("检测到未配置 API_KEY。请在 Zeabur/Vercel 环境变量中添加 API_KEY 变量。");
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

执行准则：
1. 【结构提取】从文本中识别所有人员，每人生成一行数据。
2. 【智能映射】将“新增”、“客资”、“新线索”等灵活对应到你的目标列。
3. 【数据清洗】日期必须转为 YYYY/MM/DD。所有数值列若无数据必须填数字 0。
4. 【纯净输出】仅输出制表符（Tab）分隔的纯文本。禁止输出 Markdown 代码块（如 \`\`\`tsv）、禁止任何开场白或解释。
5. 【逻辑补全】如果没有提取到某人的某些数据，根据常识补 0。

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
