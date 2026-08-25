import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { cn } from '../utils';
import { useTranslation } from '../i18n/useTranslation';

interface ReportsModalProps {
  onClose: () => void;
  fullReport: string;
  viberGeneral: string;
}

export function ReportsModal({ onClose, fullReport, viberGeneral }: ReportsModalProps) {
  const { language } = useTranslation();
  const isBg = language === 'bg';
  const [activeTab, setActiveTab] = useState<'full' | 'viberGeneral'>('full');
  const [copied, setCopied] = useState(false);

  const content = {
    full: fullReport,
    viberGeneral: viberGeneral
  }[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {isBg ? 'Генериране на финансови отчети' : 'Generate Reports'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-200 px-4 pt-2 gap-4">
          <button
            className={cn("pb-2 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer", activeTab === 'full' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700")}
            onClick={() => setActiveTab('full')}
          >
            {isBg ? 'Пълен финансов отчет' : 'Full Report'}
          </button>
          <button
            className={cn("pb-2 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer", activeTab === 'viberGeneral' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700")}
            onClick={() => setActiveTab('viberGeneral')}
          >
            {isBg ? 'Viber (Неплатени такси)' : 'Viber (General)'}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-slate-50 relative group">
          <pre className="font-mono text-xs md:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{content}</pre>
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 p-2 bg-white border border-slate-200 shadow-sm rounded-md text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span className="text-xs font-bold">{copied ? (isBg ? 'Копирано!' : 'Copied!') : (isBg ? 'Копирай текста' : 'Copy')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
