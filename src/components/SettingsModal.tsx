import { useState, useEffect } from 'react';
import { X, Save, Github } from 'lucide-react';
import { GitHubCreds } from '../types';
import { useTranslation } from '../i18n/useTranslation';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { language } = useTranslation();
  const isBg = language === 'bg';
  const [creds, setCreds] = useState<GitHubCreds>({ token: '', gistId: '' });

  useEffect(() => {
    const saved = localStorage.getItem('Condo_GH_Creds');
    if (saved) {
      try {
        setCreds(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('Condo_GH_Creds', JSON.stringify(creds));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Github className="w-5 h-5 text-slate-700" /> 
            {isBg ? 'Настройки за синхронизация с GitHub' : 'GitHub Sync Settings'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              {isBg ? 'GitHub Личен Токен (Personal Access Token)' : 'GitHub Personal Access Token'}
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white font-mono"
              placeholder="ghp_..."
              value={creds.token}
              onChange={e => setCreds({ ...creds, token: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-500">
              {isBg ? 'Изисква права (scope) за \'gist\'.' : "Requires 'gist' scope."}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              {isBg ? 'ID на Gist хранилище' : 'Gist ID'}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white font-mono"
              placeholder="e.g. 8f8d2b3c..."
              value={creds.gistId}
              onChange={e => setCreds({ ...creds, gistId: e.target.value })}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isBg ? 'Отказ' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold uppercase text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" /> {isBg ? 'Запази' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

