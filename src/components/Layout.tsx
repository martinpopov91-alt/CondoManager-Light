import { ReactNode } from 'react';
import { 
  Settings, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Download,
  Cloud,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../utils';
import { useTranslation } from '../i18n/useTranslation';
import { useTheme } from '../theme/useTheme';

interface LayoutProps {
  children: ReactNode;
  year: number;
  month: number;
  activeTab: 'dashboard' | 'instructions';
  onTabChange: (tab: 'dashboard' | 'instructions') => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenSettings: () => void;
  onSync: () => void;
  onExport: () => void;
  onReports: () => void;
}

export function Layout({ 
  children, 
  year, 
  month, 
  activeTab,
  onTabChange,
  onPrevMonth, 
  onNextMonth, 
  onOpenSettings, 
  onSync, 
  onExport, 
  onReports 
}: LayoutProps) {
  const { t, language, setLanguage } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const monthName = t(`generic.months.${month - 1}` as any);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 font-sans print:block transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-slate-900 border-r border-slate-800 flex-shrink-0 print:hidden shadow-lg z-20">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-indigo-400 font-bold uppercase tracking-wider text-xs">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm font-black text-sm">
              7D
            </div>
            <div>
              <span className="text-white block leading-tight">{t('app.title')}</span>
              <span className="text-[10px] text-slate-400 font-normal">Block 7D Management</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 flex flex-col gap-1.5">
          {/* Dashboard Tab Button */}
          <button 
            type="button"
            onClick={() => onTabChange('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-left",
              activeTab === 'dashboard'
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t('app.dashboard') || 'Dashboard'}</span>
          </button>

          {/* Instructions of Use Tab Button */}
          <button 
            type="button"
            onClick={() => onTabChange('instructions')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-left",
              activeTab === 'instructions'
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" />
              <span>{t('app.instructions') || 'Instructions of Use'}</span>
            </div>
            {activeTab !== 'instructions' && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/20">
                Guide
              </span>
            )}
          </button>

          <div className="my-2 border-t border-slate-800" />

          {/* Reports Modal Action */}
          <button 
            type="button"
            onClick={onReports} 
            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
          >
            <FileText className="w-4 h-4" />
            <span>{t('app.reports')}</span>
          </button>

          {/* Export CSV Action */}
          <button 
            type="button"
            onClick={onExport} 
            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Bottom Controls */}
          <div className="mt-auto border-t border-slate-800 pt-3 flex flex-col gap-1.5">
            {/* Theme & Language Bar */}
            <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 bg-slate-800/60 rounded-lg">
              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                <Globe className="w-3 h-3 text-slate-400 mr-0.5" />
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={cn("text-[11px] font-bold transition-colors cursor-pointer", language === 'en' ? "text-indigo-400 font-black" : "text-slate-500 hover:text-slate-300")}
                >
                  EN
                </button>
                <span className="text-slate-700 text-xs">|</span>
                <button
                  type="button"
                  onClick={() => setLanguage('bg')}
                  className={cn("text-[11px] font-bold transition-colors cursor-pointer", language === 'bg' ? "text-indigo-400 font-black" : "text-slate-500 hover:text-slate-300")}
                >
                  BG
                </button>
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? (t('app.themeLight') || 'Switch to Light Mode') : (t('app.themeDark') || 'Switch to Dark Mode')}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition-colors cursor-pointer text-[11px] font-bold"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>

            {/* Settings */}
            <button 
              type="button"
              onClick={onOpenSettings} 
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer text-left"
            >
              <Settings className="w-4 h-4" />
              <span>{t('app.settings')}</span>
            </button>

            {/* Cloud Sync */}
            <button 
              type="button"
              onClick={onSync} 
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-left"
            >
              <Cloud className="w-4 h-4" />
              <span>{t('app.saveToCloud')}</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center print:hidden shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
            7D
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase leading-tight">
              {t('app.title')}
            </h1>
            <span className="text-[10px] text-indigo-400">Block 7D</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-300" />}
          </button>

          <div className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={cn("text-[10px] font-bold transition-colors", language === 'en' ? "text-indigo-400" : "text-slate-500")}
            >
              EN
            </button>
            <span className="text-slate-600 text-[10px]">|</span>
            <button
              type="button"
              onClick={() => setLanguage('bg')}
              className={cn("text-[10px] font-bold transition-colors", language === 'bg' ? "text-indigo-400" : "text-slate-500")}
            >
              BG
            </button>
          </div>
          <button 
            type="button"
            onClick={onSync} 
            className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={onOpenSettings} 
            className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 print:block pb-16 md:pb-0">
        {/* Top Bar with Time Picker (Visible in Dashboard view) */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between flex-shrink-0 print:hidden transition-colors">
          <div className="flex items-center gap-3">
            {activeTab === 'dashboard' ? (
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={onPrevMonth} 
                  title="Previous Month"
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase min-w-[130px] text-center tracking-wide">
                  {monthName} {year}
                </h2>
                <button 
                  type="button"
                  onClick={onNextMonth} 
                  title="Next Month"
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t('app.instructions') || 'Instructions of Use & Calculation Guide'}
                </h2>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Desktop Top Bar Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? (t('app.themeLight') || 'Switch to Light Mode') : (t('app.themeDark') || 'Switch to Dark Mode')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-xs font-semibold shadow-2xs"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{t('app.themeLight') || 'Light'}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">{t('app.themeDark') || 'Dark'}</span>
                </>
              )}
            </button>

            {/* Quick tab switcher on desktop top bar */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === 'dashboard'
                    ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t('app.dashboard') || 'Dashboard'}</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('instructions')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === 'instructions'
                    ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('app.instructions') || 'Instructions'}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-auto content-start print:overflow-visible">
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('app.title')}</h1>
            <h2 className="text-lg font-bold text-slate-600 dark:text-slate-400 uppercase mt-1">
              {monthName} {year}
            </h2>
          </div>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-1.5 pb-3 print:hidden z-50 shadow-lg">
        <button 
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors cursor-pointer",
            activeTab === 'dashboard' ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase">{t('app.dashboard') || 'Табло'}</span>
        </button>

        <button 
          type="button"
          onClick={() => onTabChange('instructions')}
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors cursor-pointer",
            activeTab === 'instructions' ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase">{t('app.instructions') || 'Инструкции'}</span>
        </button>

        <button 
          type="button"
          onClick={onReports} 
          className="flex flex-col items-center gap-1 p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase">{t('app.reports')}</span>
        </button>

        <button 
          type="button"
          onClick={onExport} 
          className="flex flex-col items-center gap-1 p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase">Export</span>
        </button>
      </nav>
    </div>
  );
}
