
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
