import { useState } from 'react';
import { FixedBill } from '../types';
import { Switch } from './ui/Switch';
import { 
  Repeat, 
  Wrench, 
  Zap, 
  Building2, 
  Car, 
  Calendar, 
  Receipt, 
  CheckCircle2, 
  HelpCircle,
  Coins,
  Calculator,
  Check,
  Loader2,
  Users,
  Percent,
  Sparkles
} from 'lucide-react';
import { cn } from '../utils';
import { useTranslation } from '../i18n/useTranslation';

interface FixedBillsProps {
  bills: FixedBill[];
  onChange: (id: string, field: 'amount' | 'isPaid' | 'isFixed', value: any) => void;
  rates?: {
    generalPerPerson?: number;
    maintPerPerson?: number;
    garagePerCell?: number;
    repairFixedPerPart?: number;
    totalMonthlyDues?: number;
  };
  onRecalculate?: () => void;
}

const billNamesDict: Record<'en' | 'bg', Record<string, string>> = {
  en: {
    'el-ent': 'Electricity (Entrance)',
    'el-elev': 'Electricity (Elevator)',
    'el-sub': 'Electricity (Substation)',
    'elev-fee': 'Elevator Fee',
    'ent-clean': 'Entrance Cleaning',
    'elev-conn': 'Elevator Connection (Yearly)',
    'tech-insp': 'Technical Inspection (Yearly)',
    'gar-el': 'Garage Electricity',
    'gar-clean': 'Garage Cleaning',
    'maint-mow': 'Mowing & Grounds',
    'maint-septic': 'Septic Servicing',
    'maint-complex': 'Complex Cleaning',
    'repair-fee': 'Repair Fee',
    'repair-fund': 'Repair Fund',
  },
  bg: {
    'el-ent': 'Ел. енергия (Вход / стълбище)',
    'el-elev': 'Ел. енергия (Асансьор)',
    'el-sub': 'Ел. енергия (Абонатна станция)',
    'elev-fee': 'Абонаментна поддръжка асансьор',
    'ent-clean': 'Почистване на входа',
    'elev-conn': 'Свързаност асансьор (Годишна)',
    'tech-insp': 'Годишен технически преглед',
    'gar-el': 'Ел. енергия гаражи',
    'gar-clean': 'Почистване гаражи',
    'maint-mow': 'Косене и озеленяване',
    'maint-septic': 'Обслужване септична яма',
    'maint-complex': 'Почистване комплекс',
    'repair-fee': 'Текущи ремонтни дейности',
    'repair-fund': 'Фонд Ремонт и обновяване',
  }
};

export function FixedBills({ bills, onChange, rates, onRecalculate }: FixedBillsProps) {
  const { t, language } = useTranslation();
  const isBg = language === 'bg';
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedSuccess, setCalculatedSuccess] = useState(false);

  const repairFundBill = bills.find(b => b.id === 'repair-fund');
  const regularBills = bills.filter(b => b.id !== 'repair-fund');

  // Metric Calculations
  const totalAmount = bills.reduce((acc, b) => acc + (b.amount || 0), 0);
  const fixedBills = bills.filter(b => b.isFixed);
  const variableBills = bills.filter(b => !b.isFixed);
  
  const fixedTotal = fixedBills.reduce((acc, b) => acc + (b.amount || 0), 0);
  const variableTotal = variableBills.reduce((acc, b) => acc + (b.amount || 0), 0);

  const paidCount = bills.filter(b => b.isPaid).length;
  const totalCount = bills.length;
  const paidPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  const handleCalculateTaxes = () => {
    setIsCalculating(true);
    setCalculatedSuccess(false);

    if (onRecalculate) {
      onRecalculate();
    }

    setTimeout(() => {
      setIsCalculating(false);
      setCalculatedSuccess(true);
      setTimeout(() => {
        setCalculatedSuccess(false);
      }, 4000);
    }, 350);
  };

  const getBillDisplayName = (bill: FixedBill) => {
    return billNamesDict[isBg ? 'bg' : 'en'][bill.id] || bill.name;
  };

  const categories = [
    { 
      id: 'general', 
      title: t('bills.catGeneral') || 'General Entrance', 
      icon: Building2, 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      filter: (b: FixedBill) => b.category === 'general'
    },
    { 
      id: 'maintenance', 
      title: t('bills.catMaintenance') || 'Maintenance & Grounds', 
      icon: Zap, 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      filter: (b: FixedBill) => b.category === 'maintenance'
    },
    { 
      id: 'garage', 
      title: t('bills.catGarage') || 'Garages & Power', 
      icon: Car, 
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      filter: (b: FixedBill) => b.category === 'garage'
    },
    { 
      id: 'yearly', 
      title: t('bills.catYearly') || 'Yearly Contracts', 
      icon: Calendar, 
      color: 'text-sky-600 bg-sky-50 border-sky-100',
      filter: (b: FixedBill) => b.category === 'yearly'
    },
  ];

  const generalRate = rates?.generalPerPerson ?? 0;
  const maintRate = rates?.maintPerPerson ?? 0;
  const residentTotalRate = generalRate + maintRate;
  const garageRate = rates?.garagePerCell ?? 0;
  const repairRate = rates?.repairFixedPerPart ?? 0;
  const totalDues = rates?.totalMonthlyDues ?? 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-4 md:p-5 mb-6">
      {/* Header & Section Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              {t('bills.dashboardTitle') || 'Monthly Bills & Utilities'}
            </h2>
            <p className="text-xs text-slate-500">
              {t('bills.dashboardSubtitle') || 'Configure entrance expenses. Mark bills as Fixed to auto-transfer amounts next month.'}
            </p>
          </div>
        </div>

        {/* Action Controls & Calculate Button */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <span>
              {isBg ? (
                <>Постоянните сметки се прехвърлят автоматично. Променливите се нулират всеки месец.</>
              ) : (
                <><strong className="text-indigo-600">Fixed</strong> bills auto-carry over. <strong className="text-slate-700">Variable</strong> bills reset.</>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCalculateTaxes}
            disabled={isCalculating}
            title={t('bills.clickToRecalc') || 'Recalculates all apartment dues and tax shares based on current bills.'}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all cursor-pointer select-none active:scale-95",
              calculatedSuccess
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            )}
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('bills.calculating') || 'Calculating Taxes...'}</span>
              </>
            ) : calculatedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-100" />
                <span>{t('bills.taxesUpdated') || 'Taxes Calculated & Applied!'}</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>{t('bills.calculateTaxes') || 'Calculate & Update Taxes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Calculated Tax Rates Breakdown Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-lg p-3.5 mb-5 text-white shadow-sm border border-indigo-950/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('bills.ratesBreakdown') || 'Calculated Tax Rates Breakdown'}
                </span>
                {calculatedSuccess && (
                  <span className="text-[9px] font-extrabold uppercase bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30 animate-pulse">
                    {t('bills.liveUpdated') || 'Live Updated'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                {t('bills.clickToRecalc') || 'All apartment dues automatically distribute these current rates per resident, garage, and ideal part.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Rate per Resident */}
            <div className="bg-white/10 hover:bg-white/15 transition-colors p-2.5 rounded-lg border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-200 text-[10px] font-bold uppercase mb-0.5">
                <span>{t('bills.ratePerPerson') || 'Rate / Resident'}</span>
                <Users className="w-3 h-3 text-indigo-300" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-white">€{residentTotalRate.toFixed(2)}</span>
                <span className="text-[10px] text-indigo-200">{t('bills.perPerson') || '/ person'}</span>
              </div>
              <span className="text-[9px] text-slate-400">
                {isBg ? `Общи €${generalRate.toFixed(2)} + Поддр. €${maintRate.toFixed(2)}` : `Gen €${generalRate.toFixed(2)} + Maint €${maintRate.toFixed(2)}`}
              </span>
            </div>

            {/* Rate per Garage */}
            <div className="bg-white/10 hover:bg-white/15 transition-colors p-2.5 rounded-lg border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-200 text-[10px] font-bold uppercase mb-0.5">
                <span>{t('bills.ratePerGarage') || 'Rate / Garage'}</span>
                <Car className="w-3 h-3 text-amber-300" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-white">€{garageRate.toFixed(2)}</span>
                <span className="text-[10px] text-amber-200">{t('bills.perCell') || '/ cell'}</span>
              </div>
              <span className="text-[9px] text-slate-400">
                {isBg ? 'Гаражи и ел. енергия' : 'Garages & Electricity'}
              </span>
            </div>

            {/* Rate per Ideal Part */}
            <div className="bg-white/10 hover:bg-white/15 transition-colors p-2.5 rounded-lg border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-sky-200 text-[10px] font-bold uppercase mb-0.5">
                <span>{t('bills.ratePerPart') || 'Rate / 1% Part'}</span>
                <Percent className="w-3 h-3 text-sky-300" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-white">€{repairRate.toFixed(4)}</span>
                <span className="text-[10px] text-sky-200">{t('bills.perPart') || '/ 1%'}</span>
              </div>
              <span className="text-[9px] text-slate-400">
                {isBg ? 'Фонд Ремонт' : 'Repair Fund Fee'}
              </span>
            </div>

            {/* Total Apartment Dues */}
            <div className="bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors p-2.5 rounded-lg border border-indigo-400/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-300 text-[10px] font-bold uppercase mb-0.5">
                <span>{t('bills.totalDues') || 'Total Dues'}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-emerald-300">€{totalDues.toFixed(2)}</span>
                <span className="text-[10px] text-emerald-200">EUR</span>
              </div>
              <span className="text-[9px] text-emerald-200/80">
                {t('bills.appliedAll') || 'Applied to all apartments'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('bills.totalBills') || 'Total Monthly Bills'}</span>
            <Coins className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-slate-800">{totalAmount.toFixed(2)}</span>
            <span className="text-xs font-bold text-slate-500">EUR</span>
          </div>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-center text-indigo-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('bills.fixedAuto') || 'Fixed (Auto)'}</span>
            <Repeat className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-indigo-950">{fixedTotal.toFixed(2)}</span>
              <span className="text-xs font-bold text-indigo-600">EUR</span>
            </div>
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
              {fixedBills.length} {fixedBills.length === 1 ? (t('bills.singleBillUnit') || 'bill') : (t('bills.billUnit') || 'bills')}
            </span>
          </div>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('bills.variableReset') || 'Variable (Resets)'}</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-800">{variableTotal.toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-500">EUR</span>
            </div>
            <span className="text-[10px] font-bold bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded">
              {variableBills.length} {variableBills.length === 1 ? (t('bills.singleBillUnit') || 'bill') : (t('bills.billUnit') || 'bills')}
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/40 border border-emerald-100 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-center text-emerald-800 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('bills.paidProgress') || 'Paid Progress'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold text-emerald-950">
                {isBg ? `${paidCount} от ${totalCount} платени` : `${paidCount} / ${totalCount} Paid`}
              </span>
              <span className="text-[10px] font-black text-emerald-700">{paidPercent}%</span>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Repair Fund Collection Banner */}
      {repairFundBill && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-lg p-3.5 md:p-4 mb-5 shadow-sm border border-indigo-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300 mt-0.5">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {t('bills.repairFundTitle') || 'Monthly Repair Fund Collection'}
                  </h3>
                  <span className="text-[9px] font-extrabold uppercase bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/20">
                    {isBg ? 'Разпределя се по % ид. части' : 'Calculated by % Ideal Parts'}
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mt-0.5 max-w-2xl">
                  {t('bills.repairFundDesc') || 'Total amount collected for the repair fund this month, split automatically across all apartments.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white/10 p-2.5 rounded-lg border border-white/10 self-stretch md:self-auto justify-between md:justify-end">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-indigo-200">{t('bills.totalAmount') || 'Total Amount'}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-24 px-2 py-1 text-xs font-bold border border-indigo-300/40 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-right"
                    value={repairFundBill.amount || ''}
                    onChange={(e) => onChange(repairFundBill.id, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <span className="text-xs font-bold text-indigo-200">EUR</span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-indigo-200">{t('bills.rolloverMode') || 'Rollover Mode'}</span>
                <button
                  type="button"
                  onClick={() => onChange(repairFundBill.id, 'isFixed', !repairFundBill.isFixed)}
                  title={repairFundBill.isFixed ? (isBg ? "Постоянна: Запазва сумата за следващия месец" : "Fixed: Amount stays same next month") : (isBg ? "Променлива: Нулира се на 0.00 следващия месец" : "Variable: Resets to 0.00 next month")}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-extrabold uppercase rounded cursor-pointer transition-all flex items-center gap-1.5 border select-none h-7",
                    repairFundBill.isFixed
                      ? "bg-indigo-500 text-white border-indigo-400 shadow-2xs"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  )}
                >
                  <Repeat className="w-3 h-3" />
                  <span>{repairFundBill.isFixed ? (isBg ? "Постоянна (Авто)" : "Fixed (Auto)") : (isBg ? "Променлива" : "Variable")}</span>
                </button>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-indigo-200">{t('bills.fundStatus') || 'Fund Status'}</span>
                <div className="flex items-center gap-2 h-7 px-1">
                  <Switch 
                    checked={repairFundBill.isPaid} 
                    onChange={(v) => onChange(repairFundBill.id, 'isPaid', v)} 
                  />
                  <span className={cn("text-[10px] font-bold", repairFundBill.isPaid ? "text-emerald-400" : "text-amber-300")}>
                    {repairFundBill.isPaid ? (t('bills.collectedFund') || 'Collected') : (t('bills.pending') || 'Pending')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Grid for regular bills */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(cat => {
          const CategoryIcon = cat.icon;
          const catBills = regularBills.filter(cat.filter);
          const catSubtotal = catBills.reduce((acc, b) => acc + (b.amount || 0), 0);

          return (
            <div key={cat.id} className="bg-slate-50/60 rounded-lg border border-slate-200/80 p-3.5 flex flex-col justify-between">
              <div>
                {/* Category Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md border", cat.color)}>
                      <CategoryIcon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-700">{cat.title}</h3>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    €{catSubtotal.toFixed(2)}
                  </span>
                </div>

                {/* Bill Items */}
                <div className="space-y-2.5">
                  {catBills.map(bill => {
                    const displayName = getBillDisplayName(bill);
                    return (
                      <div 
                        key={bill.id} 
                        className={cn(
                          "p-2 rounded-md border transition-all flex flex-col gap-2",
                          bill.isPaid 
                            ? "bg-white border-emerald-200 shadow-2xs" 
                            : bill.isFixed 
                              ? "bg-white border-indigo-200/80" 
                              : "bg-white border-slate-200"
                        )}
                      >
                        {/* Top Row: Title & Paid Switch */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 leading-tight truncate" title={displayName}>
                            {displayName}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.2 rounded uppercase",
                              bill.isPaid ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                            )}>
                              {bill.isPaid ? (t('bills.paid') || 'Paid') : (t('bills.pending') || 'Pending')}
                            </span>
                            <Switch 
                              checked={bill.isPaid} 
                              onChange={(v) => onChange(bill.id, 'isPaid', v)} 
                            />
                          </div>
                        </div>

                        {/* Bottom Row: Fixed Badge Button + Amount Input */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => onChange(bill.id, 'isFixed', !bill.isFixed)}
                            title={bill.isFixed ? (isBg ? "Постоянна: Запазва сумата за следващия месец" : "Fixed: Amount stays same next month") : (isBg ? "Променлива: Нулира се на 0.00 следващия месец" : "Variable: Resets to 0.00 next month")}
                            className={cn(
                              "px-2 py-0.5 text-[9px] font-extrabold uppercase rounded cursor-pointer transition-all flex items-center gap-1 border select-none",
                              bill.isFixed
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:text-slate-700"
                            )}
                          >
                            <Repeat className="w-2.5 h-2.5" />
                            <span>{bill.isFixed ? (t('bills.fixedPill') || 'Fixed') : (t('bills.variablePill') || 'Variable')}</span>
                          </button>

                          <div className="flex items-center gap-1 w-24">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-0.5 text-xs font-bold border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white text-right"
                              value={bill.amount || ''}
                              onChange={(e) => onChange(bill.id, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">EUR</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

