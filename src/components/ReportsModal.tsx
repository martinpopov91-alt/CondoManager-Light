import { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Layers, 
  FileText, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';
import { cn } from '../utils';
import { useTranslation } from '../i18n/useTranslation';
import { MonthData, CalculatedApartmentState, Apartment, CalculatedFund } from '../types';
import { 
  generateFullReport, 
  generateViberGeneral, 
  generateExpensesReport, 
  exportExpensesToCSV,
  billNamesDict,
  categoryLabelsDict
} from '../utils/reports';

interface ReportsModalProps {
  onClose: () => void;
  monthData: MonthData;
  apartments: CalculatedApartmentState[];
  config: Apartment[];
  funds: CalculatedFund[];
  pastMonthsData?: MonthData[];
  initialTab?: 'expenses' | 'full' | 'viberGeneral';
  fullReport?: string;
  viberGeneral?: string;
  onSeedSampleMonths?: () => void;
  onClearSampleMonths?: () => void;
}

export function ReportsModal({ 
  onClose, 
  monthData,
  apartments,
  config,
  funds,
  pastMonthsData = [],
  initialTab = 'expenses',
  fullReport: propFullReport,
  viberGeneral: propViberGeneral,
  onSeedSampleMonths,
  onClearSampleMonths
}: ReportsModalProps) {
  const { t, language } = useTranslation();
  const isBg = language === 'bg';
  
  const [activeTab, setActiveTab] = useState<'expenses' | 'full' | 'viberGeneral'>(initialTab);
  const [timeframe, setTimeframe] = useState<number | 'all'>(6);
  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual');
  const [viberShowOldDebt, setViberShowOldDebt] = useState(true);
  const [viberIncludePaid, setViberIncludePaid] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({
    [`${monthData.year}-${monthData.month}`]: true
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filtered past months based on timeframe
  const filteredPastMonths = useMemo(() => {
    if (timeframe === 'all') return pastMonthsData;
    const pastLimit = Math.max(0, timeframe - 1);
    return pastMonthsData.slice(0, pastLimit);
  }, [pastMonthsData, timeframe]);

  // Combined months for analysis: current month first, then past months
  const allAnalyzedMonths = useMemo(() => {
    return [monthData, ...filteredPastMonths];
  }, [monthData, filteredPastMonths]);

  // Generate textual reports
  const fullReportText = useMemo(() => {
    return propFullReport || generateFullReport(monthData, apartments, config, funds, isBg ? 'bg' : 'en', filteredPastMonths);
  }, [propFullReport, monthData, apartments, config, funds, isBg, filteredPastMonths]);

  const viberGeneralText = useMemo(() => {
    return propViberGeneral || generateViberGeneral(apartments, config, isBg ? 'bg' : 'en', {
      showOldDebt: viberShowOldDebt,
      includePaid: viberIncludePaid,
      month: monthData.month,
      year: monthData.year
    });
  }, [propViberGeneral, apartments, config, isBg, viberShowOldDebt, viberIncludePaid, monthData.month, monthData.year]);

  const expensesReportText = useMemo(() => {
    return generateExpensesReport(
      monthData, 
      pastMonthsData, 
      isBg ? 'bg' : 'en', 
      timeframe === 'all' ? 999 : timeframe
    );
  }, [monthData, pastMonthsData, isBg, timeframe]);

  // Calculate detailed metrics for the visual view
  const visualStats = useMemo(() => {
    const list = allAnalyzedMonths.map(m => {
      const fixedTotal = (m.fixedBills || []).reduce((s, b) => s + (b.amount || 0), 0);
      const paidFixed = (m.fixedBills || []).filter(b => b.isPaid).reduce((s, b) => s + (b.amount || 0), 0);
      const dynTotal = (m.dynamicExpenses || []).reduce((s, d) => s + (d.cost || 0), 0);
      const total = fixedTotal + dynTotal;
      return {
        key: `${m.year}-${m.month}`,
        month: m.month,
        year: m.year,
        fixedTotal,
        paidFixed,
        dynTotal,
        total,
        bills: m.fixedBills || [],
        dynamics: m.dynamicExpenses || []
      };
    });

    const grandTotal = list.reduce((s, m) => s + m.total, 0);
    const avgMonthly = list.length > 0 ? grandTotal / list.length : 0;
    
    // Variance between current month and its immediate prior month
    let currentDiff = 0;
    let currentPct = 0;
    if (list.length > 1) {
      currentDiff = list[0].total - list[1].total;
      currentPct = list[1].total > 0 ? (currentDiff / list[1].total) * 100 : 0;
    }

    // Category aggregations across all months
    const catMap: Record<string, number> = {};
    list.forEach(m => {
      m.bills.forEach(b => {
        const cat = b.category || 'general';
        catMap[cat] = (catMap[cat] || 0) + (b.amount || 0);
      });
      m.dynamics.forEach(d => {
        const cat = d.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + (d.cost || 0);
      });
    });

    const categoryList = Object.entries(catMap)
      .filter(([_, val]) => val > 0)
      .sort((a, b) => b[1] - a[1]);

    return {
      list,
      grandTotal,
      avgMonthly,
      currentDiff,
      currentPct,
      categoryList
    };
  }, [allAnalyzedMonths]);

  const activeContentToCopy = useMemo(() => {
    if (activeTab === 'expenses') return expensesReportText;
    if (activeTab === 'full') return fullReportText;
    return viberGeneralText;
  }, [activeTab, expensesReportText, fullReportText, viberGeneralText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContentToCopy);
    setCopied(true);
    showToast(isBg ? 'Отчетът е копиран в клипборда!' : 'Report copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    exportExpensesToCSV(monthData, pastMonthsData, isBg ? 'bg' : 'en');
    showToast(isBg ? 'Сваля се CSV файл с историята на разходите...' : 'Downloading expenses CSV file...');
  };

  const toggleMonth = (key: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const hasSampleDataLoaded = pastMonthsData.some(m => m.notes?.includes('Sample month archive'));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 md:px-6 md:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-800">
                {t('reports.title') || (isBg ? 'Финансови отчети и справки' : 'Financial Reports & Analytics')}
              </h2>
              <p className="text-xs text-slate-500">
                {isBg 
                  ? `Блок 7Д • Месец ${monthData.month.toString().padStart(2, '0')}/${monthData.year} • Налични предходни месеци: ${pastMonthsData.length}`
                  : `Block 7D • Month ${monthData.month.toString().padStart(2, '0')}/${monthData.year} • Available past months: ${pastMonthsData.length}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer"
            title={isBg ? 'Затвори' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4 md:px-6 bg-white gap-2">
          <div className="flex gap-2 md:gap-4 overflow-x-auto py-2">
            <button
              className={cn(
                "pb-2 px-2 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
                activeTab === 'expenses' 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
              onClick={() => setActiveTab('expenses')}
            >
              <Receipt className="w-4 h-4" />
              <span>{t('reports.tabExpenses') || (isBg ? 'Отчет за разходите (многомесечен)' : 'Multi-Month Expenses Report')}</span>
              {pastMonthsData.length > 0 && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                  +{pastMonthsData.length} mo.
                </span>
              )}
            </button>
            <button
              className={cn(
                "pb-2 px-2 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
                activeTab === 'full' 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
              onClick={() => setActiveTab('full')}
            >
              <FileText className="w-4 h-4" />
              <span>{t('reports.tabFull') || (isBg ? 'Пълен финансов отчет' : 'Full Financial Report')}</span>
            </button>
            <button
              className={cn(
                "pb-2 px-2 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
                activeTab === 'viberGeneral' 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
              onClick={() => setActiveTab('viberGeneral')}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('reports.tabViber') || (isBg ? 'Viber (Неплатени такси)' : 'Viber (Unpaid Dues)')}</span>
            </button>
          </div>

          {/* Quick Action Buttons on right */}
          <div className="flex items-center gap-2 py-2">
            {activeTab === 'expenses' && (
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title={isBg ? 'Свали таблица с разходите за всички месеци в CSV' : 'Export all months expenses to CSV'}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('reports.exportExpensesCsv') || 'Export CSV'}</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (t('reports.copied') || (isBg ? 'Копирано!' : 'Copied!')) : (t('reports.copy') || (isBg ? 'Копирай отчета' : 'Copy Report'))}</span>
            </button>
          </div>
        </div>

        {/* Expenses Sub-Header Controls */}
        {activeTab === 'expenses' && (
          <div className="p-3 md:px-6 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {t('reports.timeframe') || (isBg ? 'Период:' : 'Period:')}
              </span>
              <div className="inline-flex bg-white rounded-lg p-0.5 border border-slate-300 shadow-2xs">
                {[
                  { key: 3, label: isBg ? '3 мес.' : '3 mos' },
                  { key: 6, label: isBg ? '6 мес.' : '6 mos' },
                  { key: 12, label: isBg ? '12 мес.' : '12 mos' },
                  { key: 'all', label: isBg ? 'Всички' : 'All' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTimeframe(opt.key as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer",
                      timeframe === opt.key 
                        ? "bg-indigo-600 text-white font-bold" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode: Visual vs Formatted Text */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                {t('reports.viewMode') || (isBg ? 'Изглед:' : 'View:')}
              </span>
              <div className="inline-flex bg-white rounded-lg p-0.5 border border-slate-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer",
                    viewMode === 'visual' 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {t('reports.viewVisual') || (isBg ? 'Таблици и сравнение' : 'Visual & Tables')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('text')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer",
                    viewMode === 'text' 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {t('reports.viewText') || (isBg ? 'Текстов формат' : 'Formatted Text')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
          
          {/* Notification Toast */}
          {toastMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
              <span>{toastMsg}</span>
              <button onClick={() => setToastMsg(null)} className="text-emerald-500 hover:text-emerald-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: EXPENSES REPORT */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              
              {/* Sample Data Helper Banner (if no previous months) */}
              {pastMonthsData.length === 0 && onSeedSampleMonths && (
                <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950">
                        {t('reports.noPastMonths') || (isBg ? 'Все още няма записани предходни месеци в локалната памет.' : 'No previous months recorded in local storage yet.')}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {t('reports.seedSamplePrompt') || (isBg 
                          ? 'Можете да заредите примерни данни за предходните 2 месеца (юли и август), за да тествате многомесечния сравнителен отчет.' 
                          : 'You can load sample expenses for the previous 2 months (July & August) to preview multi-month reporting.')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSeedSampleMonths();
                      showToast(t('reports.sampleLoaded') || (isBg ? 'Примерните предходни месеци бяха заредени!' : 'Sample previous months loaded!'));
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('reports.seedSampleBtn') || (isBg ? 'Зареди примерни месеци' : 'Load Sample Past Months')}</span>
                  </button>
                </div>
              )}

              {/* Sample Data Clear Option */}
              {hasSampleDataLoaded && onClearSampleMonths && (
                <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    {isBg ? 'Заредени са примерни месеци за тестване.' : 'Sample archive months are currently active for testing.'}
                  </span>
                  <button
                    onClick={() => {
                      onClearSampleMonths();
                      showToast(isBg ? 'Примерните месеци бяха премахнати.' : 'Sample months removed.');
                    }}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('reports.clearSampleBtn') || (isBg ? 'Премахни примерните' : 'Remove Sample Months')}</span>
                  </button>
                </div>
              )}

              {viewMode === 'visual' ? (
                <>
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {/* Total Period Expenses */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('reports.totalExpenses') || (isBg ? 'Общо разходи за периода' : 'Total Period Expenses')}
                      </span>
                      <div className="mt-2">
                        <span className="text-xl md:text-2xl font-black text-slate-800">
                          €{visualStats.grandTotal.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 ml-1">EUR</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {allAnalyzedMonths.length} {allAnalyzedMonths.length === 1 ? (isBg ? 'месец' : 'month') : (isBg ? 'месеца' : 'months')}
                      </span>
                    </div>

                    {/* Monthly Average */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('reports.avgPerMonth') || (isBg ? 'Средно на месец' : 'Avg / Month')}
                      </span>
                      <div className="mt-2">
                        <span className="text-xl md:text-2xl font-black text-indigo-600">
                          €{visualStats.avgMonthly.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 ml-1">EUR</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {isBg ? 'Разходи за консумативи и поддръжка' : 'Recurring utilities & maintenance'}
                      </span>
                    </div>

                    {/* Current Month vs Previous Month */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('reports.currentVsPrev') || (isBg ? 'Текущ спрямо предходен' : 'Current vs Previous')}
                      </span>
                      <div className="mt-2 flex items-center gap-1.5">
                        {allAnalyzedMonths.length > 1 ? (
                          <>
                            {visualStats.currentDiff > 0 ? (
                              <TrendingUp className="w-5 h-5 text-rose-500" />
                            ) : visualStats.currentDiff < 0 ? (
                              <TrendingDown className="w-5 h-5 text-emerald-500" />
                            ) : null}
                            <span className={cn(
                              "text-xl md:text-2xl font-black",
                              visualStats.currentDiff > 0 ? "text-rose-600" : visualStats.currentDiff < 0 ? "text-emerald-600" : "text-slate-700"
                            )}>
                              {visualStats.currentDiff > 0 ? '+' : ''}€{visualStats.currentDiff.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-slate-400">
                            {isBg ? 'Няма предходен' : 'No prior month'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {allAnalyzedMonths.length > 1 
                          ? `${visualStats.currentDiff > 0 ? '+' : ''}${visualStats.currentPct.toFixed(1)}% ${visualStats.currentDiff > 0 ? (t('reports.trendHigher') || 'higher') : (t('reports.trendLower') || 'lower')}`
                          : (isBg ? 'Първи записан месец' : 'Initial recorded month')}
                      </span>
                    </div>

                    {/* Analyzed Period Range */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('reports.monthsAnalyzed') || (isBg ? 'Обхванати месеци' : 'Analyzed Months')}
                      </span>
                      <div className="mt-2">
                        <span className="text-lg md:text-xl font-bold text-slate-800">
                          {allAnalyzedMonths[allAnalyzedMonths.length - 1].month.toString().padStart(2, '0')}/{allAnalyzedMonths[allAnalyzedMonths.length - 1].year} – {allAnalyzedMonths[0].month.toString().padStart(2, '0')}/{allAnalyzedMonths[0].year}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                        ✓ {allAnalyzedMonths.length} {isBg ? 'активни месечни отчета' : 'monthly records'}
                      </span>
                    </div>
                  </div>

                  {/* Category Breakdown Over Time */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 md:p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
                      <span>{t('reports.categoryBreakdown') || (isBg ? 'Разбивка на разходите по пера (за целия период)' : 'Period Expenses Breakdown by Category')}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {isBg ? 'Сбор от всички сметки и извънредни разходи' : 'Sum of utilities & extra expenses'}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {visualStats.categoryList.map(([catKey, total]) => {
                        const pct = visualStats.grandTotal > 0 ? (total / visualStats.grandTotal) * 100 : 0;
                        const label = categoryLabelsDict[language][catKey] || catKey;
                        return (
                          <div key={catKey} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <span className="text-xs font-bold text-slate-700 leading-tight">{label}</span>
                              <span className="text-xs font-black text-slate-900 whitespace-nowrap">€{total.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div 
                                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(3, pct))}%` }} 
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 font-medium">{pct.toFixed(1)}% {isBg ? 'от общите разходи' : 'of total'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Month-by-Month History Accordion / Cards */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                      <span>{t('reports.monthlyHistory') || (isBg ? 'Разходи по месеци (текущ и предходни)' : 'Month-by-Month Expense History')}</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        {isBg ? 'Кликнете на месец за подробен списък на фактурите' : 'Click a month to expand itemized invoices'}
                      </span>
                    </h3>

                    {visualStats.list.map((m, idx) => {
                      const isCurrent = idx === 0;
                      const isOpen = !!expandedMonths[m.key];
                      const mLabel = `${m.month.toString().padStart(2, '0')}/${m.year}`;
                      
                      // Calculate prior month diff for this specific item
                      const priorM = visualStats.list[idx + 1];
                      const diff = priorM ? m.total - priorM.total : 0;
                      const diffPct = priorM && priorM.total > 0 ? (diff / priorM.total) * 100 : 0;

                      return (
                        <div key={m.key} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
                          {/* Card Header Row */}
                          <div 
                            onClick={() => toggleMonth(m.key)}
                            className="p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs",
                                isCurrent ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                              )}>
                                {m.month}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900">{mLabel}</span>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      {isBg ? 'Текущ месец' : 'Current'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500">
                                  {m.bills.length} {isBg ? 'регулярни сметки' : 'utility bills'}
                                  {m.dynamics.length > 0 && ` • ${m.dynamics.length} ${isBg ? 'извънредни' : 'extra expenses'}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Subtotals breakdown */}
                              <div className="hidden sm:flex flex-col text-right text-xs">
                                <span className="text-slate-500">
                                  {isBg ? 'Сметки:' : 'Bills:'} <span className="font-semibold text-slate-700">€{m.fixedTotal.toFixed(2)}</span>
                                  {m.dynTotal > 0 && ` | ${isBg ? 'Извънр.:' : 'Extra:'} €${m.dynTotal.toFixed(2)}`}
                                </span>
                                {priorM && (
                                  <span className={cn(
                                    "text-[10px] font-semibold",
                                    diff > 0 ? "text-rose-600" : diff < 0 ? "text-emerald-600" : "text-slate-500"
                                  )}>
                                    {diff > 0 ? '+' : ''}€{diff.toFixed(2)} ({diff > 0 ? '+' : ''}{diffPct.toFixed(1)}% vs {priorM.month}/{priorM.year})
                                  </span>
                                )}
                              </div>

                              {/* Total Price Badge */}
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <span className="text-base font-black text-slate-900 block leading-tight">
                                    €{m.total.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">EUR</span>
                                </div>
                                <div className="p-1 rounded-md text-slate-400 hover:text-slate-700">
                                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Invoices / Expenses Table */}
                          {isOpen && (
                            <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4">
                              {/* Fixed Bills Section */}
                              <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                  {t('bills.totalBills') || (isBg ? 'Постоянни и регулярни сметки' : 'Recurring Utilities & Services')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {m.bills.map(b => {
                                    const bName = billNamesDict[language][b.id] || b.name;
                                    const bCat = categoryLabelsDict[language][b.category] || b.category;
                                    return (
                                      <div key={b.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                                        <div className="overflow-hidden">
                                          <div className="text-xs font-bold text-slate-800 truncate">{bName}</div>
                                          <div className="text-[10px] text-slate-400">{bCat}</div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className="text-xs font-bold text-slate-900">€{(b.amount || 0).toFixed(2)}</span>
                                          <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                            b.isPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                          )}>
                                            {b.isPaid ? (isBg ? 'Платена' : 'Paid') : (isBg ? 'Очаква се' : 'Unpaid')}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Dynamic Expenses Section (if any) */}
                              {m.dynamics.length > 0 && (
                                <div>
                                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-2">
                                    {t('dynamic.title') || (isBg ? 'Извънредни и еднократни разходи' : 'One-off / Extra Outflows')}
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {m.dynamics.map(d => {
                                      const dCat = categoryLabelsDict[language][d.category] || d.category;
                                      return (
                                        <div key={d.id} className="p-2.5 bg-white rounded-lg border border-rose-200/70 flex items-center justify-between gap-2 shadow-2xs">
                                          <div className="overflow-hidden">
                                            <div className="text-xs font-bold text-slate-800 truncate">{d.title}</div>
                                            <div className="text-[10px] text-rose-500 font-semibold">{dCat}</div>
                                          </div>
                                          <span className="text-xs font-bold text-rose-600 whitespace-nowrap">-€{d.cost.toFixed(2)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Formatted Mono Text View */
                <div className="relative group">
                  <pre className="font-mono text-xs md:text-sm text-slate-800 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {expensesReportText}
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-4 right-4 p-2 bg-white border border-slate-200 shadow-sm rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs font-bold">{copied ? (isBg ? 'Копирано!' : 'Copied!') : (isBg ? 'Копирай текста' : 'Copy')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL FINANCIAL REPORT */}
          {activeTab === 'full' && (
            <div className="relative group">
              <pre className="font-mono text-xs md:text-sm text-slate-800 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {fullReportText}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 p-2 bg-white border border-slate-200 shadow-sm rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span className="text-xs font-bold">{copied ? (isBg ? 'Копирано!' : 'Copied!') : (isBg ? 'Копирай текста' : 'Copy')}</span>
              </button>
            </div>
          )}

          {/* TAB 3: VIBER / MESSAGING NOTICE */}
          {activeTab === 'viberGeneral' && (
            <div className="relative group space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <span>💡</span>
                  <span>
                    {t('reports.viberHelp') || (isBg 
                      ? 'Текстът обобщава платените и неплатените такси за директно изпращане във Viber групата на входа.' 
                      : 'This notice summarizes paid and unpaid dues for direct sharing in your condominium Viber group.')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                  <label className="flex items-center gap-2 font-bold cursor-pointer select-none bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={viberIncludePaid}
                      onChange={(e) => setViberIncludePaid(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-indigo-950">
                      {t('reports.viberIncludePaid') || (isBg ? 'Включи платените' : 'Include paid')}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer select-none bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={viberShowOldDebt}
                      onChange={(e) => setViberShowOldDebt(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-indigo-950">
                      {t('reports.viberShowOldDebt') || (isBg ? 'Показвай стари такси' : 'Show old dues')}
                    </span>
                  </label>
                </div>
              </div>

              <div className="relative">
                <pre className="font-mono text-xs md:text-sm text-slate-800 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {viberGeneralText}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-4 right-4 p-2 bg-white border border-slate-200 shadow-sm rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span className="text-xs font-bold">{copied ? (isBg ? 'Копирано!' : 'Copied!') : (isBg ? 'Копирай текста' : 'Copy')}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 md:px-6 md:py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Block 7D Condominium Management</span>
            <span>•</span>
            <span>{isBg ? 'Всички суми са в EUR' : 'All amounts in EUR'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            {isBg ? 'Затвори' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
