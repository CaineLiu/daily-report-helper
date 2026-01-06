
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export async function* transformDailyReportStream(
  rawText: string, 
  columns: string[],
  templateHint: string
) {
  // 每次调用时实例化，确保使用最新的环境变量
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `
        任务：将非结构化多人日报转换为飞书多维表格可用的TSV数据（无表头）。
        
        列定义（必须按顺序严格对齐）：
        ${columns.map((col, i) => `${i + 1}. ${col}`).join('\n')}
        
        要求：
        1. 【同义词识别】提取“总客资”、“客资”等关键词数值填入对应列。
        2. 【多人识别】一人一事一行。
        3. 【日期格式】统一为 YYYY/MM/DD。
        4. 【全局补零】缺失数值必须填【0】。
        5. 【严格格式】仅输出 TSV 文本，用制表符（\t）分隔，严禁 Markdown 代码块。
        
        背景：${templateHint}
        待处理内容：
        ${rawText}
      `,
      config: {
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    for await (const chunk of responseStream) {
      const text = (chunk as GenerateContentResponse).text;
      if (text) yield text;
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("转换失败，请检查 API Key 配置。");
  }
}
