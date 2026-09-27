import { useState, useEffect } from 'react';
import { X, Save, Github, Sun, Moon } from 'lucide-react';
import { GitHubCreds } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { useTheme } from '../theme/useTheme';
import { cn } from '../utils';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { t, language } = useTranslation();
  const isBg = language === 'bg';
  const { theme, setTheme } = useTheme();
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md flex flex-col transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Github className="w-5 h-5 text-slate-700 dark:text-slate-300" /> 
            {isBg ? 'Настройки' : 'Settings'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Theme Selector Section */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              {t('app.theme') || (isBg ? 'Цветова тема' : 'Appearance Theme')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                  theme === 'light'
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                )}
              >
                <Sun className={cn("w-4 h-4", theme === 'light' ? "text-amber-500" : "text-slate-400")} />
                <span>{t('app.themeLight') || 'Light Mode'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer",
                  theme === 'dark'
                    ? "bg-indigo-950/70 border-indigo-500 text-indigo-300 shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                )}
              >
                <Moon className={cn("w-4 h-4", theme === 'dark' ? "text-indigo-400" : "text-slate-400")} />
                <span>{t('app.themeDark') || 'Dark Mode'}</span>
              </button>
            </div>
          </div>

          {/* GitHub Sync Credentials */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">
              {isBg ? 'GitHub Личен Токен (Personal Access Token)' : 'GitHub Personal Access Token'}
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="ghp_..."
              value={creds.token}
              onChange={e => setCreds({ ...creds, token: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isBg ? 'Изисква права (scope) за \'gist\'.' : "Requires 'gist' scope."}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">
              {isBg ? 'ID на Gist хранилище' : 'Gist ID'}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="e.g. 8f8d2b3c..."
              value={creds.gistId}
              onChange={e => setCreds({ ...creds, gistId: e.target.value })}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-850 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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

