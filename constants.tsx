export interface TemplateConfig {
  label: string;
  hint: string;
  columns: string[];
}

export interface HistoryItem {
  date: string;
  text: string;
  template: string;
}

export const APP_TITLE = "日报转换助手";
export const APP_SUBTITLE = "让日报粘贴进飞书多维表格从未如此简单";

export const TEMPLATES: Record<string, TemplateConfig> = {
  public: {
    label: "公域流量",
    hint: "提取账号状态、剪辑发布及客资。日期统一为 YYYY/MM/DD。",
    columns: [
      "日期", 
      "运营人", 
      "IP", 
      "今日此IP封号数", 
      "今日此IP可用账号数", 
      "今日此IP剪辑数", 
      "今日审核数", 
      "今日此IP视频发布数", 
      "今日总文案数", 
      "今日客资数"
    ]
  },
  private: {
    label: "私域运营",
    hint: "根据客资转化路径提取。'今日总客资'列将尝试从文本汇总提取。",
    columns: [
      "日期", 
      "私域", 
      "今日新分配客资", 
      "今日新微信客资", 
      "今日总客资", 
      "以往未接通客资", 
      "今日未接通客资", 
      "今日无效客资", 
      "今日加微信客资", 
      "今日签约客户", 
      "客户今日上门/已操作客户", 
      "今日放款客户"
    ]
  },
  custom: {
    label: "✨ 自定义",
    hint: "手动指定列名，AI 将根据你的定义灵活提取数据。",
    columns: [] // 动态输入
  }
};
