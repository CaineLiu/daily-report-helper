
import React, { useState, useEffect } from 'react';
import { transformDailyReportStream } from './services/geminiService';
import { TEMPLATES, APP_TITLE, APP_SUBTITLE } from './constants';
import { HistoryItem } from './types';
import Button from './components/Button';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('public');
  const [copySuccess, setCopySuccess] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('report_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleTransform = async () => {
    if (!inputText.trim()) return;
    setIsTransforming(true);
    setOutputText('');
    
    try {
      const template = TEMPLATES[activeTemplate];
      const stream = transformDailyReportStream(inputText, template.columns, template.hint);
      
      let fullResult = '';
      for await (const chunk of stream) {
        fullResult += chunk;
        setOutputText(fullResult);
      }

      const newHistory = [{
        date: new Date().toLocaleString(),
        text: fullResult,
        template: template.label
      }, ...history].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('report_history', JSON.stringify(newHistory));
    } catch (err) {
      alert(err instanceof Error ? err.message : '转换出错了，请检查 API Key');
    } finally {
      setIsTransforming(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleClear = () => {
    if (confirm('确定要清空输入内容吗？')) {
      setInputText('');
      setOutputText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <header className="mb-10 text-center">
          <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider uppercase">
            Internal Tool
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{APP_TITLE}</h1>
          <p className="text-slate-500 font-medium">{APP_SUBTITLE}</p>
        </header>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {Object.entries(TEMPLATES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveTemplate(key)}
              className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeTemplate === key 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* 左侧：输入 */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  原始日报内容
                </h2>
                <button 
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  清空内容
                </button>
              </div>
              <textarea
                className="w-full h-[450px] p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm leading-relaxed text-slate-600 placeholder:text-slate-300"
                placeholder="在此粘贴员工发在群里的日报原文..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
          </div>

          {/* 右侧：结果 */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  转换结果 (TSV数据)
                </h2>
                <div className="flex gap-2">
                  <Button 
                    variant={copySuccess ? "secondary" : "outline"} 
                    className="text-xs py-1.5 px-4 rounded-xl"
                    onClick={handleCopy}
                    disabled={!outputText}
                  >
                    {copySuccess ? '✅ 已复制' : '复制TSV数据'}
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <textarea
                  readOnly
                  className="w-full h-[450px] p-4 bg-slate-900 border-none rounded-2xl font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto selection:bg-emerald-500/30"
                  value={outputText}
                  placeholder="等待 AI 转换... 转换后点击上方按钮复制，然后在飞书多维表格点击首个单元格直接粘贴即可。"
                />
                {!outputText && !isTransforming && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-slate-500 text-sm">转换后在此实时预览数据</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button 
            onClick={handleTransform} 
            isLoading={isTransforming} 
            className="w-full max-w-md py-5 text-xl rounded-2xl shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isTransforming ? 'AI 正在深度解析中...' : '立即开始智能转换'}
          </Button>
          <p className="text-[10px] text-slate-400">基于 Gemini 3.0 Flash 引擎提供强力驱动</p>
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-16 bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">最近处理记录</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => setOutputText(item.text)}
                  className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold">{item.template}</span>
                    <span className="text-[10px] text-slate-300">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2">{item.text.substring(0, 50)}...</p>
                  <span className="text-[10px] font-bold text-blue-500 group-hover:underline">点击载入结果</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <footer className="mt-20 mb-10 text-slate-400 text-xs text-center">
        <p>© 2024 Daily Report Helper. 专为提高人事行政效率打造。</p>
      </footer>
    </div>
  );
}
