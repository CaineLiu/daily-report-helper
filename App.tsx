
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
  const [customColumns, setCustomColumns] = useState('日期, 姓名, 完成单数, 备注');
  const [copySuccess, setCopySuccess] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('report_history_v2');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const fillExample = () => {
    const examples: Record<string, string> = {
      public: "张三：今日视频发布3个，客资2条，封号0，IP正常。\n李四：昨天补报，发布1个，审核中2个。",
      private: "王五 2024-05-20：新分配5个，加微信2个，签约1个。\n赵六：今天没开单，上门1个。",
      custom: "小王：今天写了5篇文案，完成度80%，备注：电脑有点卡。"
    };
    setInputText(examples[activeTemplate] || examples.public);
  };

  const handleTransform = async () => {
    if (!inputText.trim()) return;
    
    let columns = TEMPLATES[activeTemplate].columns;
    if (activeTemplate === 'custom') {
      columns = customColumns.split(/[,，\n]/).map(c => c.trim()).filter(c => c);
      if (columns.length === 0) {
        alert('请输入至少一个自定义列名');
        return;
      }
    }

    setIsTransforming(true);
    setOutputText('');
    
    try {
      const template = TEMPLATES[activeTemplate];
      const stream = transformDailyReportStream(inputText, columns, template.hint);
      
      let fullResult = '';
      for await (const chunk of stream) {
        fullResult += chunk;
        setOutputText(fullResult);
      }

      const cleanResult = fullResult.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
      setOutputText(cleanResult);

      const newHistory = [{
        date: new Date().toLocaleString(),
        text: cleanResult,
        template: template.label
      }, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('report_history_v2', JSON.stringify(newHistory));
    } catch (err) {
      alert(err instanceof Error ? err.message : '发生了未知错误');
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

  return (
    <div className="min-h-screen bg-[#fcfdfe] p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl animate-in fade-in duration-700">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[11px] font-bold mb-5 border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            ZEABUR 实时云端运行
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tighter italic">
            {APP_TITLE.split('').map((char, i) => (
              <span key={i} className={i % 2 === 0 ? "text-blue-600" : ""}>{char}</span>
            ))}
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">{APP_SUBTITLE}</p>
        </header>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {Object.entries(TEMPLATES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => { setActiveTemplate(key); setOutputText(''); }}
              className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeTemplate === key 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {activeTemplate === 'custom' && (
          <div className="w-full max-w-2xl mx-auto mb-8 animate-in slide-in-from-top-2">
            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 text-center">配置表格列名</label>
              <input 
                type="text"
                value={customColumns}
                onChange={(e) => setCustomColumns(e.target.value)}
                className="w-full px-5 py-3 bg-white border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold text-slate-700 transition-all"
                placeholder="例如：日期, 名字, 客资, 转化, 备注"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* 输入端 */}
          <div className="group bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 flex flex-col h-[650px] transition-all hover:shadow-2xl hover:border-blue-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-100">IN</div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">源数据录入</h2>
              </div>
              <button onClick={fillExample} className="text-[10px] font-bold text-blue-500 hover:underline">试试例子</button>
            </div>
            <textarea
              className="flex-1 w-full p-6 bg-slate-50 border-none rounded-[32px] focus:ring-4 focus:ring-blue-50 outline-none resize-none text-sm leading-relaxed text-slate-600 custom-scrollbar placeholder:text-slate-300 font-medium"
              placeholder="直接粘贴聊天记录里的乱序日报..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {/* 输出端 */}
          <div className="group bg-slate-900 rounded-[40px] shadow-2xl p-8 flex flex-col h-[650px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg shadow-emerald-900/20">OUT</div>
                <h2 className="text-sm font-black text-slate-200 uppercase tracking-widest">飞书多维表格格式</h2>
              </div>
              <Button 
                variant={copySuccess ? "secondary" : "outline"} 
                className={`text-[10px] font-bold h-9 px-4 rounded-xl transition-all ${copySuccess ? 'bg-emerald-500 border-none' : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
                onClick={handleCopy}
                disabled={!outputText}
              >
                {copySuccess ? '已复制到剪贴板' : '复制表格数据 (TSV)'}
              </Button>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-[32px] p-6 overflow-hidden flex flex-col relative z-10 border border-slate-700/50">
              <textarea
                readOnly
                className="w-full h-full bg-transparent border-none focus:ring-0 outline-none font-mono text-[11px] leading-relaxed text-emerald-400 custom-scrollbar overflow-x-auto whitespace-pre"
                value={outputText}
                placeholder="等待 AI 提取数据..."
              />
            </div>
            <p className="mt-5 text-[10px] text-slate-500 font-medium italic relative z-10">💡 提示：在飞书多维表格第一个空格点击并 Ctrl+V 即可自动分列。</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 mb-20">
          <Button 
            onClick={handleTransform} 
            isLoading={isTransforming} 
            className="w-full max-w-md h-16 text-xl font-black rounded-3xl shadow-2xl shadow-blue-200 hover:translate-y-[-2px] active:translate-y-[1px] transition-all bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
          >
            {isTransforming ? 'AI 正在深度解析中...' : '开始智能转换'}
          </Button>

          {history.length > 0 && (
            <div className="w-full max-w-5xl">
              <div className="flex items-center gap-6 mb-6">
                <div className="h-px flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">最近记录</span>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {history.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => setOutputText(item.text)}
                    className="group bg-white p-4 rounded-2xl border border-slate-50 hover:border-blue-200 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.template}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{item.text.split('\t')[0] || '空记录'}</p>
                    <p className="text-[8px] text-slate-200 mt-2 font-medium">{item.date.split(',')[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="w-full max-w-6xl pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-300 text-[10px] font-bold uppercase tracking-widest pb-10">
        <div className="flex gap-6">
          <span className="hover:text-slate-600 transition-colors">V2.1 PRO</span>
          <span className="hover:text-slate-600 transition-colors">POWERED BY GEMINI 3.0</span>
        </div>
        <p>© 2024 DAILY REPORT AUTOMATION ENGINE</p>
      </footer>
    </div>
  );
}
