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
  Trash2,
  Percent,
  Users,
  Car,
  Wallet,
  CreditCard,
  Printer,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2
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
  const [fullViewMode, setFullViewMode] = useState<'visual' | 'text'>('visual');
  const [fullFilter, setFullFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
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

  // Full Report Unit Rate Calculations
  const fullReportRates = useMemo(() => {
    let totalPeople = 0;
    let totalGarages = 0;
    let totalParts = 0;

    config.forEach(apt => {
      const aptState = apartments.find(s => s.id === apt.id);
      const isExempt = aptState?.isEmpty !== undefined
        ? aptState.isEmpty
        : (apt.isEmpty ?? (apt.id === '1.3' || apt.peopleCount === 0));

      if (!isExempt) {
        totalPeople += apt.peopleCount;
      }
      totalGarages += apt.garageCount;
      totalParts += apt.idealParts;
    });

    const generalBills = (monthData.fixedBills || []).filter(b => b.category === 'general');
    const yearlyBills = (monthData.fixedBills || []).filter(b => b.category === 'yearly');
    const maintBills = (monthData.fixedBills || []).filter(b => b.category === 'maintenance');
    const garageBills = (monthData.fixedBills || []).filter(b => b.category === 'garage');
    const repairFixedBills = (monthData.fixedBills || []).filter(b => b.category === 'repair');

    const generalTotal = generalBills.reduce((acc, b) => acc + (b.amount || 0), 0) + 
                         yearlyBills.reduce((acc, b) => acc + ((b.amount || 0) / 12), 0);
    const maintTotal = maintBills.reduce((acc, b) => acc + (b.amount || 0), 0);
    const garageTotal = garageBills.reduce((acc, b) => acc + (b.amount || 0), 0);
    const repairFixedTotal = repairFixedBills.reduce((acc, b) => acc + (b.amount || 0), 0);

    const generalPerPerson = totalPeople > 0 ? generalTotal / totalPeople : 0;
    const maintPerPerson = totalPeople > 0 ? maintTotal / totalPeople : 0;
    const residentTotalRate = generalPerPerson + maintPerPerson;
    const garagePerCell = totalGarages > 0 ? garageTotal / totalGarages : 0;
    const repairFixedPerPart = totalParts > 0 ? repairFixedTotal / totalParts : 0;

    return {
      totalPeople,
      totalGarages,
      totalParts,
      generalTotal,
      maintTotal,
      garageTotal,
      repairFixedTotal,
      generalPerPerson,
      maintPerPerson,
      residentTotalRate,
      garagePerCell,
      repairFixedPerPart,
    };
  }, [config, apartments, monthData.fixedBills]);

  // Full Report Collection and Outflow Calculations
  const fullReportCollections = useMemo(() => {
    let totalPaidAmount = 0;
    let cashPaidAmount = 0;
    let revolutPaidAmount = 0;
    let totalUnpaidAmount = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let paidCashCount = 0;
    let paidRevolutCount = 0;

    apartments.forEach(a => {
      const effectivePaid = (a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0)
        ? a.paidAmount
        : (a.status === 'Paid' ? Math.max(0, a.grandTotal) : 0);

      if (a.status === 'Paid' || effectivePaid > 0) {
        paidCount++;
        totalPaidAmount += effectivePaid;
        if (a.paymentMethod === 'revolut') {
          revolutPaidAmount += effectivePaid;
          paidRevolutCount++;
        } else {
          cashPaidAmount += effectivePaid;
          paidCashCount++;
        }
      } else {
        unpaidCount++;
        totalUnpaidAmount += Math.max(0, a.grandTotal);
      }
    });

    const totalDuesExpected = totalPaidAmount + totalUnpaidAmount;
    const collectionRate = totalDuesExpected > 0 ? Math.round((totalPaidAmount / totalDuesExpected) * 100) : 100;

    const fixedTotal = (monthData.fixedBills || []).reduce((s, b) => s + (b.amount || 0), 0);
    const fixedPaid = (monthData.fixedBills || []).filter(b => b.isPaid).reduce((s, b) => s + (b.amount || 0), 0);
    const fixedPending = (monthData.fixedBills || []).filter(b => !b.isPaid).reduce((s, b) => s + (b.amount || 0), 0);
    const dynamicTotal = (monthData.dynamicExpenses || []).reduce((s, d) => s + (d.cost || 0), 0);
    const totalExpenses = fixedTotal + dynamicTotal;
    const totalExpensesPaid = fixedPaid + dynamicTotal;
    const netMonthlyCashflow = totalPaidAmount - totalExpensesPaid;

    return {
      totalPaidAmount,
      cashPaidAmount,
      revolutPaidAmount,
      totalUnpaidAmount,
      paidCount,
      unpaidCount,
      paidCashCount,
      paidRevolutCount,
      totalDuesExpected,
      collectionRate,
      fixedTotal,
      fixedPaid,
      fixedPending,
      dynamicTotal,
      totalExpenses,
      totalExpensesPaid,
      netMonthlyCashflow
    };
  }, [apartments, monthData.fixedBills, monthData.dynamicExpenses]);

  // Filtered apartments list for full report
  const filteredFullApartments = useMemo(() => {
    return apartments.filter(a => {
      const isPaid = a.status === 'Paid' || (a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0);
      if (fullFilter === 'paid') return isPaid;
      if (fullFilter === 'unpaid') return !isPaid;
      return true;
    });
  }, [apartments, fullFilter]);

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 z-50 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="p-4 md:px-6 md:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">
                {t('reports.title') || (isBg ? 'Финансови отчети и справки' : 'Financial Reports & Analytics')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBg 
                  ? `Блок 7Д • Месец ${monthData.month.toString().padStart(2, '0')}/${monthData.year} • Налични предходни месеци: ${pastMonthsData.length}`
                  : `Block 7D • Month ${monthData.month.toString().padStart(2, '0')}/${monthData.year} • Available past months: ${pastMonthsData.length}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isBg ? 'Затвори' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 bg-white dark:bg-slate-900 gap-2 transition-colors">
          <div className="flex gap-2 md:gap-4 overflow-x-auto py-2">
            <button
              className={cn(
                "pb-2 px-2 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
                activeTab === 'expenses' 
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
              onClick={() => setActiveTab('expenses')}
            >
              <Receipt className="w-4 h-4" />
              <span>{t('reports.tabExpenses') || (isBg ? 'Отчет за разходите (многомесечен)' : 'Multi-Month Expenses Report')}</span>
              {pastMonthsData.length > 0 && (
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
                  +{pastMonthsData.length} mo.
                </span>
              )}
            </button>
            <button
              className={cn(
                "pb-2 px-2 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
                activeTab === 'full' 
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
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
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
          <div className="p-3 md:px-6 bg-slate-100/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                {t('reports.timeframe') || (isBg ? 'Период:' : 'Period:')}
              </span>
              <div className="inline-flex bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-300 dark:border-slate-700 shadow-2xs">
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
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode: Visual vs Formatted Text */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                {t('reports.viewMode') || (isBg ? 'Изглед:' : 'View:')}
              </span>
              <div className="inline-flex bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-300 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer",
                    viewMode === 'visual' 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
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
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  {t('reports.viewText') || (isBg ? 'Текстов формат' : 'Formatted Text')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Report Sub-Header Controls */}
        {activeTab === 'full' && (
          <div className="p-3 md:px-6 bg-slate-100/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
            {/* View Mode: Visual vs Formatted Text */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                {t('reports.viewMode') || (isBg ? 'Изглед:' : 'View:')}
              </span>
              <div className="inline-flex bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-300 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFullViewMode('visual')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer",
                    fullViewMode === 'visual' 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  {t('reports.viewVisual') || (isBg ? 'Интерактивен отчет' : 'Visual Statement')}
                </button>
                <button
                  type="button"
                  onClick={() => setFullViewMode('text')}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer",
                    fullViewMode === 'text' 
                      ? "bg-indigo-600 text-white font-bold" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  {t('reports.viewText') || (isBg ? 'Текстов формат' : 'Formatted Text')}
                </button>
              </div>
            </div>

            {/* Filter Buttons (when in visual mode) */}
            {fullViewMode === 'visual' && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  {isBg ? 'Филтър:' : 'Filter:'}
                </span>
                <button
                  type="button"
                  onClick={() => setFullFilter('all')}
                  className={cn(
                    "px-2 py-0.5 rounded font-bold text-xs transition-colors cursor-pointer",
                    fullFilter === 'all'
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  {t('reports.filterAll') || (isBg ? 'Всички' : 'All')} ({apartments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFullFilter('paid')}
                  className={cn(
                    "px-2 py-0.5 rounded font-bold text-xs transition-colors cursor-pointer",
                    fullFilter === 'paid'
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  {t('reports.filterPaid') || (isBg ? 'Платени' : 'Paid')} ({fullReportCollections.paidCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFullFilter('unpaid')}
                  className={cn(
                    "px-2 py-0.5 rounded font-bold text-xs transition-colors cursor-pointer",
                    fullFilter === 'unpaid'
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  {t('reports.filterUnpaid') || (isBg ? 'Неплатени' : 'Unpaid')} ({fullReportCollections.unpaidCount})
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{t('reports.printReport') || (isBg ? 'Принтирай' : 'Print')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950 transition-colors">
          
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
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('reports.totalExpenses') || (isBg ? 'Общо разходи за периода' : 'Total Period Expenses')}
                      </span>
                      <div className="mt-2">
                        <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
                          €{visualStats.grandTotal.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">EUR</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {allAnalyzedMonths.length} {allAnalyzedMonths.length === 1 ? (isBg ? 'месец' : 'month') : (isBg ? 'месеца' : 'months')}
                      </span>
                    </div>

                    {/* Monthly Average */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('reports.avgPerMonth') || (isBg ? 'Средно на месец' : 'Avg / Month')}
                      </span>
                      <div className="mt-2">
                        <span className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          €{visualStats.avgMonthly.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">EUR</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {isBg ? 'Разходи за консумативи и поддръжка' : 'Recurring utilities & maintenance'}
                      </span>
                    </div>

                    {/* Current Month vs Previous Month */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                              visualStats.currentDiff > 0 ? "text-rose-600 dark:text-rose-400" : visualStats.currentDiff < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                            )}>
                              {visualStats.currentDiff > 0 ? '+' : ''}€{visualStats.currentDiff.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                            {isBg ? 'Няма предходен' : 'No prior month'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {allAnalyzedMonths.length > 1 
                          ? `${visualStats.currentDiff > 0 ? '+' : ''}${visualStats.currentPct.toFixed(1)}% ${visualStats.currentDiff > 0 ? (t('reports.trendHigher') || 'higher') : (t('reports.trendLower') || 'lower')}`
                          : (isBg ? 'Първи записан месец' : 'Initial recorded month')}
                      </span>
                    </div>

                    {/* Analyzed Period Range */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('reports.monthsAnalyzed') || (isBg ? 'Обхванати месеци' : 'Analyzed Months')}
                      </span>
                      <div className="mt-2">
                        <span className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
                          {allAnalyzedMonths[allAnalyzedMonths.length - 1].month.toString().padStart(2, '0')}/{allAnalyzedMonths[allAnalyzedMonths.length - 1].year} – {allAnalyzedMonths[0].month.toString().padStart(2, '0')}/{allAnalyzedMonths[0].year}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        ✓ {allAnalyzedMonths.length} {isBg ? 'активни месечни отчета' : 'monthly records'}
                      </span>
                    </div>
                  </div>

                  {/* Category Breakdown Over Time */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 md:p-5 transition-colors">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center justify-between">
                      <span>{t('reports.categoryBreakdown') || (isBg ? 'Разбивка на разходите по пера (за целия период)' : 'Period Expenses Breakdown by Category')}</span>
                      <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                        {isBg ? 'Сбор от всички сметки и извънредни разходи' : 'Sum of utilities & extra expenses'}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {visualStats.categoryList.map(([catKey, total]) => {
                        const pct = visualStats.grandTotal > 0 ? (total / visualStats.grandTotal) * 100 : 0;
                        const label = categoryLabelsDict[language][catKey] || catKey;
                        return (
                          <div key={catKey} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between transition-colors">
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{label}</span>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">€{total.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                              <div 
                                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(3, pct))}%` }} 
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{pct.toFixed(1)}% {isBg ? 'от общите разходи' : 'of total'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Month-by-Month History Accordion / Cards */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span>{t('reports.monthlyHistory') || (isBg ? 'Разходи по месеци (текущ и предходни)' : 'Month-by-Month Expense History')}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
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
                        <div key={m.key} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
                          {/* Card Header Row */}
                          <div 
                            onClick={() => toggleMonth(m.key)}
                            className="p-3 md:p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs",
                                isCurrent ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                              )}>
                                {m.month}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{mLabel}</span>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                      {isBg ? 'Текущ месец' : 'Current'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {m.bills.length} {isBg ? 'регулярни сметки' : 'utility bills'}
                                  {m.dynamics.length > 0 && ` • ${m.dynamics.length} ${isBg ? 'извънредни' : 'extra expenses'}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Subtotals breakdown */}
                              <div className="hidden sm:flex flex-col text-right text-xs">
                                <span className="text-slate-500 dark:text-slate-400">
                                  {isBg ? 'Сметки:' : 'Bills:'} <span className="font-semibold text-slate-700 dark:text-slate-200">€{m.fixedTotal.toFixed(2)}</span>
                                  {m.dynTotal > 0 && ` | ${isBg ? 'Извънр.:' : 'Extra:'} €${m.dynTotal.toFixed(2)}`}
                                </span>
                                {priorM && (
                                  <span className={cn(
                                    "text-[10px] font-semibold",
                                    diff > 0 ? "text-rose-600 dark:text-rose-400" : diff < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                                  )}>
                                    {diff > 0 ? '+' : ''}€{diff.toFixed(2)} ({diff > 0 ? '+' : ''}{diffPct.toFixed(1)}% vs {priorM.month}/{priorM.year})
                                  </span>
                                )}
                              </div>

                              {/* Total Price Badge */}
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <span className="text-base font-black text-slate-900 dark:text-slate-100 block leading-tight">
                                    €{m.total.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">EUR</span>
                                </div>
                                <div className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
                                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Invoices / Expenses Table */}
                          {isOpen && (
                            <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                              {/* Fixed Bills Section */}
                              <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                  {t('bills.totalBills') || (isBg ? 'Постоянни и регулярни сметки' : 'Recurring Utilities & Services')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {m.bills.map(b => {
                                    const bName = billNamesDict[language][b.id] || b.name;
                                    const bCat = categoryLabelsDict[language][b.category] || b.category;
                                    return (
                                      <div key={b.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs">
                                        <div className="overflow-hidden">
                                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{bName}</div>
                                          <div className="text-[10px] text-slate-400 dark:text-slate-500">{bCat}</div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">€{(b.amount || 0).toFixed(2)}</span>
                                          <span className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                            b.isPaid ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
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
                                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
                                    {t('dynamic.title') || (isBg ? 'Извънредни и еднократни разходи' : 'One-off / Extra Outflows')}
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {m.dynamics.map(d => {
                                      const dCat = categoryLabelsDict[language][d.category] || d.category;
                                      return (
                                        <div key={d.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-rose-200/70 dark:border-rose-900/60 flex items-center justify-between gap-2 shadow-2xs">
                                          <div className="overflow-hidden">
                                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{d.title}</div>
                                            <div className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold">{dCat}</div>
                                          </div>
                                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">-€{d.cost.toFixed(2)}</span>
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
                  <pre className="font-mono text-xs md:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {expensesReportText}
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs font-bold">{copied ? (isBg ? 'Копирано!' : 'Copied!') : (isBg ? 'Копирай текста' : 'Copy')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL FINANCIAL REPORT */}
          {activeTab === 'full' && (
            <div className="space-y-6">
              {fullViewMode === 'visual' ? (
                <>
                  {/* Executive Financial Summary KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {/* Inflows / Collections */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {t('reports.totalPaidIn') || (isBg ? 'Общо събрани приходи' : 'Total Dues Collected')}
                        </span>
                        <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="my-2">
                        <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          €{fullReportCollections.totalPaidAmount.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">EUR</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400">{fullReportCollections.collectionRate}% {isBg ? 'събираемост' : 'collected'}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{fullReportCollections.paidCount} / {apartments.length} {isBg ? 'ап.' : 'apts'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold truncate">
                            {isBg ? 'Каса:' : 'Cash:'} €{fullReportCollections.cashPaidAmount.toFixed(0)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold truncate">
                            Revolut: €{fullReportCollections.revolutPaidAmount.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Outflows / Expenses */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {t('reports.outflowsSection') || (isBg ? 'Извършени разходи' : 'Expenses & Outflows')}
                        </span>
                        <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="my-2">
                        <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
                          €{fullReportCollections.totalExpenses.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">EUR</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                          <span>{monthData.fixedBills.length} {isBg ? 'сметки' : 'bills'}</span>
                          <span>{monthData.dynamicExpenses.length > 0 ? `+${monthData.dynamicExpenses.length} ${isBg ? 'извънредни' : 'extra'}` : (isBg ? 'Няма извънредни' : 'No extra')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold truncate">
                            {isBg ? 'Платени:' : 'Paid:'} €{fullReportCollections.totalExpensesPaid.toFixed(0)}
                          </span>
                          {fullReportCollections.fixedPending > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold truncate">
                              {isBg ? 'Дължими:' : 'Due:'} €{fullReportCollections.fixedPending.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Net Cashflow Balance */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {t('reports.netMonthlyBalance') || (isBg ? 'Нетен резултат (Баланс)' : 'Net Operating Balance')}
                        </span>
                        {fullReportCollections.netMonthlyCashflow >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        )}
                      </div>
                      <div className="my-2">
                        <span className={cn(
                          "text-xl md:text-2xl font-black",
                          fullReportCollections.netMonthlyCashflow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                          {fullReportCollections.netMonthlyCashflow >= 0 ? '+' : ''}€{fullReportCollections.netMonthlyCashflow.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">EUR</span>
                      </div>
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                        <span className={cn(
                          "font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                          fullReportCollections.netMonthlyCashflow >= 0 
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                        )}>
                          {fullReportCollections.netMonthlyCashflow >= 0 
                            ? (t('reports.surplus') || (isBg ? 'Излишък' : 'Surplus'))
                            : (t('reports.deficit') || (isBg ? 'Дефицит' : 'Deficit'))}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {isBg ? 'Приходи - Платени сметки' : 'Inflows vs Paid Outflows'}
                        </span>
                      </div>
                    </div>

                    {/* Outstanding Arrears */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {isBg ? 'Неплатени такси (Дълг)' : 'Outstanding Arrears'}
                        </span>
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="my-2">
                        <span className="text-xl md:text-2xl font-black text-rose-600 dark:text-rose-400">
                          €{fullReportCollections.totalUnpaidAmount.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">EUR</span>
                      </div>
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {fullReportCollections.unpaidCount} {isBg ? 'апартамента с дълг' : 'apartments overdue'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {fullReportCollections.unpaidCount === 0 ? (isBg ? 'Всички са изрядни' : 'All clear') : (isBg ? 'Изисква се събиране' : 'Requires follow-up')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* OFFICIAL UNIT TAX RATES & TARIFF FORMULAS CARD */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4 md:p-5 text-white shadow-sm border border-indigo-900/80">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-indigo-800/60">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            {t('reports.taxRatesSection') || (isBg ? 'Официални тарифи и ставки за таксите (Идеални части и други)' : 'Official Unit Tax Rates & Calculation Formulas')}
                          </h3>
                          <p className="text-xs text-indigo-200/80">
                            {isBg 
                              ? 'Базови ставки, приложени за автоматичното начисляване на таксите за този месец' 
                              : 'Base rates applied for automatic calculation of monthly dues for all apartments'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase bg-indigo-500/30 text-indigo-200 px-2.5 py-1 rounded-full border border-indigo-400/30 hidden sm:inline-block">
                        {isBg ? 'Тарифи за месеца' : 'Active Tariffs'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      {/* Rate 1: IDEAL PARTS TAX (REPAIR FUND) */}
                      <div className="bg-white/10 hover:bg-white/15 transition-colors p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-sky-200 text-xs font-bold uppercase mb-1">
                            <span className="flex items-center gap-1.5">
                              <Percent className="w-3.5 h-3.5 text-sky-300" />
                              {t('reports.idealPartsTaxRate') || (isBg ? 'Ставка за 1% ид. части' : 'Rate / 1% Ideal Part')}
                            </span>
                            <span className="text-[10px] font-black bg-sky-500/30 text-sky-100 px-1.5 py-0.5 rounded border border-sky-400/30">
                              {isBg ? 'Фонд Ремонт' : 'Repair Fund'}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-2 mb-1">
                            <span className="text-2xl font-black text-white">€{fullReportRates.repairFixedPerPart.toFixed(4)}</span>
                            <span className="text-xs font-bold text-sky-200">EUR / 1%</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {isBg 
                              ? `Целеви фонд ремонт: €${fullReportRates.repairFixedTotal.toFixed(2)} EUR (разпределени върху ${fullReportRates.totalParts.toFixed(2)}% ид. части).`
                              : `Target repair fund: €${fullReportRates.repairFixedTotal.toFixed(2)} EUR (distributed over ${fullReportRates.totalParts.toFixed(2)}% co-ownership).`}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-sky-200/90 font-medium">
                          {isBg 
                            ? '💡 Разпределя се строго според нотариалния % идеални части на всеки апартамент.'
                            : '💡 Proportional to co-ownership share from notary deed.'}
                        </div>
                      </div>

                      {/* Rate 2: RESIDENT RATE */}
                      <div className="bg-white/10 hover:bg-white/15 transition-colors p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-indigo-200 text-xs font-bold uppercase mb-1">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-300" />
                              {t('reports.residentRate') || (isBg ? 'Ставка на обитател' : 'Rate / Resident')}
                            </span>
                            <span className="text-[10px] font-black bg-indigo-500/30 text-indigo-100 px-1.5 py-0.5 rounded border border-indigo-400/30">
                              {isBg ? 'Вход + Двор' : 'Utilities + Maint'}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-2 mb-1">
                            <span className="text-2xl font-black text-white">€{fullReportRates.residentTotalRate.toFixed(2)}</span>
                            <span className="text-xs font-bold text-indigo-200">EUR / {isBg ? 'човек' : 'person'}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {isBg 
                              ? `Вход и асансьор: €${fullReportRates.generalPerPerson.toFixed(2)} + Поддръжка: €${fullReportRates.maintPerPerson.toFixed(2)}.`
                              : `Entrance & elevator: €${fullReportRates.generalPerPerson.toFixed(2)} + Maintenance: €${fullReportRates.maintPerPerson.toFixed(2)}.`}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-indigo-200/90 font-medium">
                          {isBg 
                            ? `База: ${fullReportRates.totalPeople} активни обитатели (необитаемите апартаменти са освободени).`
                            : `Base: ${fullReportRates.totalPeople} paying residents (vacant apartments exempt).`}
                        </div>
                      </div>

                      {/* Rate 3: GARAGE CELL RATE */}
                      <div className="bg-white/10 hover:bg-white/15 transition-colors p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-amber-200 text-xs font-bold uppercase mb-1">
                            <span className="flex items-center gap-1.5">
                              <Car className="w-3.5 h-3.5 text-amber-300" />
                              {t('reports.garageRate') || (isBg ? 'Ставка на гараж' : 'Rate / Garage Space')}
                            </span>
                            <span className="text-[10px] font-black bg-amber-500/30 text-amber-100 px-1.5 py-0.5 rounded border border-amber-400/30">
                              {isBg ? 'Гаражи' : 'Garages'}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-2 mb-1">
                            <span className="text-2xl font-black text-white">€{fullReportRates.garagePerCell.toFixed(2)}</span>
                            <span className="text-xs font-bold text-amber-200">EUR / {isBg ? 'клетка' : 'cell'}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {isBg 
                              ? `Ел. енергия и почистване на гаражите: общо €${fullReportRates.garageTotal.toFixed(2)} EUR.`
                              : `Garage lighting & power: total €${fullReportRates.garageTotal.toFixed(2)} EUR.`}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-amber-200/90 font-medium">
                          {isBg 
                            ? `База: ${fullReportRates.totalGarages} гаражни клетки.`
                            : `Base: ${fullReportRates.totalGarages} garage spaces.`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT CHANNELS BREAKDOWN (EVERYTHING BEING PAID) */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 md:p-5 transition-colors">
                    <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          {t('reports.inflowsSection') || (isBg ? 'Събрани приходи и плащания от съседи' : 'Collections & Incoming Payments')}
                        </h3>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        {isBg ? 'Общо постъпления:' : 'Total Inflows:'} €{fullReportCollections.totalPaidAmount.toFixed(2)} EUR
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Cash Channel */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                            {t('reports.paidViaCash') || (isBg ? 'В брой (Каса на входа)' : 'Cash (In Hand)')}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                            {fullReportCollections.paidCashCount} {isBg ? 'ап.' : 'apts'}
                          </span>
                        </div>
                        <div className="my-1">
                          <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                            €{fullReportCollections.cashPaidAmount.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-slate-400 ml-1">EUR</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${fullReportCollections.totalPaidAmount > 0 ? (fullReportCollections.cashPaidAmount / fullReportCollections.totalPaidAmount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {fullReportCollections.totalPaidAmount > 0 ? ((fullReportCollections.cashPaidAmount / fullReportCollections.totalPaidAmount) * 100).toFixed(0) : 0}% {isBg ? 'от всички събрани приходи' : 'of collections'}
                        </span>
                      </div>

                      {/* Revolut Channel */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                            {t('reports.paidViaRevolut') || (isBg ? 'Банков превод / Revolut' : 'Revolut Transfers')}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                            {fullReportCollections.paidRevolutCount} {isBg ? 'ап.' : 'apts'}
                          </span>
                        </div>
                        <div className="my-1">
                          <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                            €{fullReportCollections.revolutPaidAmount.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-slate-400 ml-1">EUR</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="bg-sky-500 h-full rounded-full transition-all"
                            style={{ width: `${fullReportCollections.totalPaidAmount > 0 ? (fullReportCollections.revolutPaidAmount / fullReportCollections.totalPaidAmount) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {fullReportCollections.totalPaidAmount > 0 ? ((fullReportCollections.revolutPaidAmount / fullReportCollections.totalPaidAmount) * 100).toFixed(0) : 0}% {isBg ? 'от всички събрани приходи' : 'of collections'}
                        </span>
                      </div>

                      {/* Unpaid Dues Channel */}
                      <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            {isBg ? 'Очаквани плащания (Дълг)' : 'Outstanding Balances'}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                            {fullReportCollections.unpaidCount} {isBg ? 'ап.' : 'apts'}
                          </span>
                        </div>
                        <div className="my-1">
                          <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                            €{fullReportCollections.totalUnpaidAmount.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-rose-400 ml-1">EUR</span>
                        </div>
                        <div className="w-full bg-rose-200 dark:bg-rose-900/60 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="bg-rose-500 h-full rounded-full transition-all"
                            style={{ width: `${fullReportCollections.totalDuesExpected > 0 ? (fullReportCollections.totalUnpaidAmount / fullReportCollections.totalDuesExpected) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-rose-700 dark:text-rose-400 mt-1 font-medium">
                          {fullReportCollections.totalDuesExpected > 0 ? ((fullReportCollections.totalUnpaidAmount / fullReportCollections.totalDuesExpected) * 100).toFixed(0) : 0}% {isBg ? 'от общо дължимите такси' : 'of total dues'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* COMPREHENSIVE APARTMENT DUES & TAX ASSESSMENT TABLE */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          {t('reports.allApartmentsDues') || (isBg ? 'Пълен регистър на таксите и плащанията по апартаменти' : 'Itemized Apartment Dues & Tax Assessment Ledger')}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isBg 
                            ? 'Детайлна справка за такса обитатели, такса гараж, такса идеални части (Ремонт) и платен статус за всеки апартамент.'
                            : 'Detailed itemization of resident fee, garage fee, ideal parts fee (Repair Fund) and payment status for every apartment.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mr-1">
                          {isBg ? `Показани ${filteredFullApartments.length} от ${apartments.length}` : `Showing ${filteredFullApartments.length} of ${apartments.length}`}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3">{isBg ? 'Апартамент & Собственик' : 'Apartment & Resident'}</th>
                            <th className="py-2.5 px-3 text-right">{isBg ? 'Обитатели & такса' : 'Residents & Fee'}</th>
                            <th className="py-2.5 px-3 text-right">{isBg ? 'Гаражи & такса' : 'Garages & Fee'}</th>
                            <th className="py-2.5 px-3 text-right bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 border-x border-indigo-100 dark:border-indigo-900/40">
                              <span className="flex items-center justify-end gap-1">
                                <Percent className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                {t('reports.idealPartsCol') || (isBg ? 'Ид. части & такса Ремонт' : 'Ideal Parts & Repair Tax')}
                              </span>
                            </th>
                            <th className="py-2.5 px-3 text-right">{isBg ? 'Текуща такса' : 'Current Due'}</th>
                            <th className="py-2.5 px-3 text-right">{isBg ? 'Стар дълг' : 'Old Arrears'}</th>
                            <th className="py-2.5 px-3 text-right">{isBg ? 'Общо дължимо' : 'Grand Total'}</th>
                            <th className="py-2.5 px-3 text-center">{isBg ? 'Статус & Платена сума' : 'Payment & Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                          {filteredFullApartments.map(a => {
                            const apt = config.find(c => c.id === a.id);
                            if (!apt) return null;

                            const isExempt = a.isEmpty !== undefined
                              ? a.isEmpty
                              : (apt.isEmpty ?? (apt.id === '1.3' || apt.peopleCount === 0));

                            const resTax = isExempt ? 0 : (apt.peopleCount * fullReportRates.residentTotalRate);
                            const garTax = apt.garageCount * fullReportRates.garagePerCell;
                            const idealTax = apt.idealParts * fullReportRates.repairFixedPerPart;

                            const effectivePaid = (a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0)
                              ? a.paidAmount
                              : (a.status === 'Paid' ? a.grandTotal : 0);

                            const isPaid = a.status === 'Paid' || effectivePaid > 0;
                            const methodLabel = a.paymentMethod === 'revolut' ? 'Revolut' : (isBg ? 'В брой' : 'Cash');

                            return (
                              <tr 
                                key={a.id}
                                className={cn(
                                  "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors",
                                  !isPaid && a.grandTotal > 0 && "bg-rose-50/20 dark:bg-rose-950/10"
                                )}
                              >
                                {/* Apartment & Owner */}
                                <td className="py-2.5 px-3 font-semibold">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{apt.name || `Ап. ${apt.id}`}</span>
                                    {isExempt && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        {isBg ? 'Празен' : 'Empty'}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[160px]">
                                    {apt.owner || (isBg ? 'Собственик' : 'Resident')}
                                  </span>
                                </td>

                                {/* Residents & Fee */}
                                <td className="py-2.5 px-3 text-right">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">€{resTax.toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {isExempt ? (isBg ? '0 (освободен)' : '0 (exempt)') : `${apt.peopleCount} × €${fullReportRates.residentTotalRate.toFixed(2)}`}
                                  </span>
                                </td>

                                {/* Garages & Fee */}
                                <td className="py-2.5 px-3 text-right">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">€{garTax.toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {apt.garageCount > 0 ? `${apt.garageCount} × €${fullReportRates.garagePerCell.toFixed(2)}` : '—'}
                                  </span>
                                </td>

                                {/* IDEAL PARTS % & REPAIR FUND TAX (HIGHLIGHTED) */}
                                <td className="py-2.5 px-3 text-right bg-indigo-50/40 dark:bg-indigo-950/30 border-x border-indigo-100 dark:border-indigo-900/40 font-mono">
                                  <div className="flex flex-col items-end">
                                    <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                                      €{idealTax.toFixed(2)}
                                    </span>
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-sans font-semibold">
                                      {apt.idealParts.toFixed(2)}% {isBg ? 'ид. части' : 'share'}
                                    </span>
                                  </div>
                                </td>

                                {/* Current Bill */}
                                <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                  €{a.currentBill.toFixed(2)}
                                </td>

                                {/* Old Debt */}
                                <td className="py-2.5 px-3 text-right">
                                  {a.oldDebt > 0 ? (
                                    <span className="font-bold text-rose-600 dark:text-rose-400">€{a.oldDebt.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>

                                {/* Grand Total */}
                                <td className="py-2.5 px-3 text-right">
                                  <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                                    €{a.grandTotal.toFixed(2)}
                                  </span>
                                </td>

                                {/* Status & Amount Paid */}
                                <td className="py-2.5 px-3 text-center">
                                  {isPaid ? (
                                    <div className="inline-flex flex-col items-center">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        <span>€{effectivePaid.toFixed(2)} EUR</span>
                                      </span>
                                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                                        {methodLabel}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex flex-col items-center">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900/60">
                                        <AlertCircle className="w-3 h-3 text-rose-500" />
                                        <span>{isBg ? 'Неплатено' : 'Unpaid'}</span>
                                      </span>
                                      {(a.monthsInDebt || 1) > 1 && (
                                        <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                                          {a.monthsInDebt} {isBg ? 'мес. дълг' : 'mos debt'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                            <td className="py-3 px-3 uppercase text-[10px] tracking-wider">
                              {isBg ? 'ОБЩО ЗА СГРАДАТА:' : 'BUILDING TOTALS:'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              €{filteredFullApartments.reduce((sum, a) => {
                                const apt = config.find(c => c.id === a.id);
                                const isExempt = a.isEmpty !== undefined ? a.isEmpty : (apt?.isEmpty ?? false);
                                return sum + (isExempt ? 0 : ((apt?.peopleCount || 0) * fullReportRates.residentTotalRate));
                              }, 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              €{filteredFullApartments.reduce((sum, a) => {
                                const apt = config.find(c => c.id === a.id);
                                return sum + ((apt?.garageCount || 0) * fullReportRates.garagePerCell);
                              }, 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right bg-indigo-50/70 dark:bg-indigo-950/50 border-x border-indigo-100 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200">
                              <span className="block font-black">
                                €{filteredFullApartments.reduce((sum, a) => {
                                  const apt = config.find(c => c.id === a.id);
                                  return sum + ((apt?.idealParts || 0) * fullReportRates.repairFixedPerPart);
                                }, 0).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-normal">
                                {filteredFullApartments.reduce((sum, a) => {
                                  const apt = config.find(c => c.id === a.id);
                                  return sum + (apt?.idealParts || 0);
                                }, 0).toFixed(2)}% {isBg ? 'ид. части' : 'share'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              €{filteredFullApartments.reduce((sum, a) => sum + (a.currentBill || 0), 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                              €{filteredFullApartments.reduce((sum, a) => sum + (a.oldDebt || 0), 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-sm">
                              €{filteredFullApartments.reduce((sum, a) => sum + (a.grandTotal || 0), 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 font-black">
                              €{filteredFullApartments.reduce((sum, a) => {
                                const amt = (a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0)
                                  ? a.paidAmount
                                  : (a.status === 'Paid' ? a.grandTotal : 0);
                                return sum + amt;
                              }, 0).toFixed(2)} {isBg ? 'платени' : 'paid'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* OUTFLOWS & EXPENSES LEDGER */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 md:p-5 transition-colors">
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          {isBg ? 'Фактури и разходи към доставчици за месеца' : 'Monthly Supplier Invoices & Building Expenses'}
                        </h3>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {isBg ? 'Общо разходи:' : 'Total Expenses:'} €{fullReportCollections.totalExpenses.toFixed(2)} EUR
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {(monthData.fixedBills || []).map(b => {
                        const billName = billNamesDict[language][b.id] || b.name;
                        const catLabel = categoryLabelsDict[language][b.category] || b.category;
                        return (
                          <div 
                            key={b.id} 
                            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                          >
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate" title={billName}>
                                {billName}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {catLabel} {b.isFixed ? (isBg ? '• Постоянна' : '• Fixed') : (isBg ? '• Променлива' : '• Variable')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                €{(b.amount || 0).toFixed(2)}
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                b.isPaid 
                                  ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" 
                                  : "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                              )}>
                                {b.isPaid ? (isBg ? 'Платена' : 'Paid') : (isBg ? 'Очаква се' : 'Pending')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(monthData.dynamicExpenses || []).length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
                          {isBg ? 'Извънредни и еднократни разходи' : 'One-Off / Extra Outflows'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {monthData.dynamicExpenses.map(d => {
                            const catLabel = categoryLabelsDict[language][d.category] || d.category;
                            return (
                              <div key={d.id} className="p-2.5 rounded-lg border border-rose-200/80 dark:border-rose-900/60 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shadow-2xs">
                                <div className="overflow-hidden">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">{d.title}</span>
                                  <span className="text-[10px] text-rose-500 font-semibold">{catLabel}</span>
                                </div>
                                <span className="text-xs font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                  -€{d.cost.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DEDICATED FUNDS BALANCES */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 md:p-5 transition-colors">
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          {isBg ? 'Движение и наличности по целеви фондове' : 'Dedicated Reserve Funds Balances & Movements'}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {isBg ? 'Всички суми са в EUR' : 'All amounts in EUR'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {funds.map(f => {
                        const net = f.collected - f.expenses;
                        return (
                          <div key={f.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                              <span>{f.name}</span>
                              <span className={cn(net >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                {net >= 0 ? `+€${net.toFixed(0)}` : `-€${Math.abs(net).toFixed(0)}`}
                              </span>
                            </div>
                            <div className="my-1">
                              <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                                €{f.endBalance.toFixed(2)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 ml-1">EUR</span>
                            </div>
                            <div className="text-[9px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex justify-between">
                                <span>{isBg ? 'Начало:' : 'Start:'}</span>
                                <span>€{f.startBalance.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                <span>{isBg ? 'Вноски:' : 'In:'}</span>
                                <span>+€{f.collected.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* FORMATTED TEXT VIEW FOR TAB 2 */
                <div className="relative group">
                  <pre className="font-mono text-xs md:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {fullReportText}
                  </pre>
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{isBg ? 'Принтирай' : 'Print'}</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? (isBg ? 'Копирано!' : 'Copied!') : (isBg ? 'Копирай текста' : 'Copy Text')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VIBER / MESSAGING NOTICE */}
          {activeTab === 'viberGeneral' && (
            <div className="relative group space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-2">
                  <span>💡</span>
                  <span>
                    {t('reports.viberHelp') || (isBg 
                      ? 'Текстът обобщава платените и неплатените такси за директно изпращане във Viber групата на входа.' 
                      : 'This notice summarizes paid and unpaid dues for direct sharing in your condominium Viber group.')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                  <label className="flex items-center gap-2 font-bold cursor-pointer select-none bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 shadow-2xs hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={viberIncludePaid}
                      onChange={(e) => setViberIncludePaid(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-indigo-950 dark:text-indigo-200">
                      {t('reports.viberIncludePaid') || (isBg ? 'Включи платените' : 'Include paid')}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer select-none bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 shadow-2xs hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={viberShowOldDebt}
                      onChange={(e) => setViberShowOldDebt(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-indigo-950 dark:text-indigo-200">
                      {t('reports.viberShowOldDebt') || (isBg ? 'Показвай стари такси' : 'Show old dues')}
                    </span>
                  </label>
                </div>
              </div>

              <div className="relative">
                <pre className="font-mono text-xs md:text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {viberGeneralText}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span className="text-xs font-bold">{copied ? (isBg ? 'Копирано!' : 'Copied!') : (isBg ? 'Копирай текста' : 'Copy')}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 md:px-6 md:py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 transition-colors">
          <div className="flex items-center gap-2">
            <span>Block 7D Condominium Management</span>
            <span>•</span>
            <span>{isBg ? 'Всички суми са в EUR' : 'All amounts in EUR'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition-colors cursor-pointer"
          >
            {isBg ? 'Затвори' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
