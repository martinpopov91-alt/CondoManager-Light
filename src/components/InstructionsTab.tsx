import { useState } from 'react';
import { 
  BookOpen, 
  Calculator, 
  Coins, 
  Repeat, 
  Users, 
  Car, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Building2, 
  Percent, 
  Calendar, 
  ShieldCheck, 
  RotateCcw,
  Zap
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { cn } from '../utils';

interface InstructionsTabProps {
  onGoToDashboard: () => void;
}

export function InstructionsTab({ onGoToDashboard }: InstructionsTabProps) {
  const { t, language } = useTranslation();
  const [activeSection, setActiveSection] = useState<'all' | 'calc' | 'funds' | 'bills' | 'workflow' | 'faq'>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Interactive Live Calculator Demo State
  const [demoResidents, setDemoResidents] = useState<number>(2);
  const [demoGarages, setDemoGarages] = useState<number>(1);
  const [demoParts, setDemoParts] = useState<number>(4.25);
  const [demoGeneralRate, setDemoGeneralRate] = useState<number>(5.50);
  const [demoMaintRate, setDemoMaintRate] = useState<number>(3.20);
  const [demoGarageRate, setDemoGarageRate] = useState<number>(7.00);
  const [demoRepairPartRate, setDemoRepairPartRate] = useState<number>(2.50); // per 1%
  const [demoElevatorBase, setDemoElevatorBase] = useState<number>(2.00);
  const [demoPrevDebt, setDemoPrevDebt] = useState<number>(0.00);

  // Computed demo values
  const demoResidentCost = demoResidents * (demoGeneralRate + demoMaintRate);
  const demoGarageCost = demoGarages * demoGarageRate;
  const demoRepairCost = (demoParts / 100) * (demoRepairPartRate * 100);
  const demoCurrentDue = demoResidentCost + demoGarageCost + demoRepairCost + demoElevatorBase;
  const demoTotalToPay = demoCurrentDue + demoPrevDebt;

  const isBg = language === 'bg';

  const faqs = [
    {
      q: isBg 
        ? 'Какво става, ако апартамент плати само част от дължимата сума?' 
        : 'What happens if an apartment pays only part of their due amount?',
      a: isBg
        ? 'Въведете реално платената сума в колона "Платено". Системата автоматично ще изчисли остатъка в "Оставащо". При преминаване към следващия месец ("Следващ месец"), този неизплатен остатък автоматично ще се добави към началното задължение (Стар дълг) на апартамента.'
        : 'Enter the amount actually paid in the "Paid" column. The system calculates the remainder in "Remaining". When transitioning to the next month ("Next Month"), this remaining debt automatically carries over into that apartment\'s starting balance for the new month.'
    },
    {
      q: isBg
        ? 'Каква е разликата между Постоянна (Fixed) и Променлива (Variable) сметка?'
        : 'What is the difference between a Fixed and Variable monthly bill?',
      a: isBg
        ? 'Постоянните сметки (Fixed) автоматично запазват въведената си сума за следващия месец (напр. чистач, абонамент асансьор, такса поддръжка). Променливите сметки (Variable) автоматично се нулират на 0.00 € всеки месец, за да въведете новата актуална фактура (напр. месечен ток за стълбище или извънреден ремонт).'
        : 'Fixed bills automatically retain their amount when rolling over to the next month (e.g. cleaning contract, elevator maintenance subscription, security). Variable bills automatically reset to €0.00 so you can enter the newly received utility invoice (e.g. monthly staircase electricity or seasonal repairs).'
    },
    {
      q: isBg
        ? 'Как се пресмята вноската за Фонд Ремонт?'
        : 'How is the Repair Fund contribution calculated?',
      a: isBg
        ? 'Вноската за Фонд Ремонт се изчислява на база процент идеални части (% Ид. части) на всеки апартамент съгласно Закона за управление на етажната собственост (ЗУЕС). Месечната целева сума за събиране се умножава по процента на конкретния имот.'
        : 'The Repair Fund contribution is distributed strictly proportional to each apartment\'s percentage of common building areas (% Ideal Parts). The total monthly collection target is multiplied by the apartment\'s % share.'
    },
    {
      q: isBg
        ? 'Как да изпратя напомняне за плащане на съседите?'
        : 'How do I send payment reminders to residents?',
      a: isBg
        ? 'Натиснете бутона "Изпрати напомняне" в главното табло. Можете да генерирате готово форматирано съобщение за Viber/SMS – както общо съобщение за целия вход, така и персонално съобщение с точната дължима сума за конкретен апартамент.'
        : 'Click the "Send Reminder" button on the main dashboard. You can generate formatted Viber / SMS texts — either a group entrance announcement or a personalized message with exact owed dues for an individual apartment.'
    },
    {
      q: isBg
        ? 'Къде се запазва въведената информация?'
        : 'Where is the entered data stored?',
      a: isBg
        ? 'Цялата информация се запазва автоматично в паметта на Вашия браузър (localStorage). Можете да използвате и бутона "Запази в облака" за синхронизация или "Export CSV" за изтегляне на архив в Excel.'
        : 'All data is automatically saved inside your browser\'s local storage. You can also use the "Save to Cloud" option for GitHub/cloud synchronization or "Export CSV" for Excel backup.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-6 md:p-8 shadow-sm border border-indigo-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              {isBg ? 'Ръководство и документация' : 'User Guide & Documentation'}
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {isBg ? 'Инструкции за ползване и алгоритми за изчисление' : 'Instructions of Use & Calculation Guide'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isBg 
                ? 'Пълно ръководство за управление на етажната собственост (Блок 7D): разпределение на сметки, формули за такси, проследяване на фондове и месечни преходи.'
                : 'Comprehensive guide for condominium management: bill distribution logic, exact mathematical formulas, fund tracking, and monthly transitions.'}
            </p>
          </div>

          <button
            onClick={onGoToDashboard}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <span>{isBg ? 'Към финансовото табло' : 'Back to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'all', label: isBg ? 'Всички раздели' : 'All Sections', icon: Layers },
          { id: 'calc', label: isBg ? '1. Формули и изчисления' : '1. Calculation Formulas', icon: Calculator },
          { id: 'bills', label: isBg ? '2. Постоянни vs Променливи сметки' : '2. Bills & Rollovers', icon: Repeat },
          { id: 'funds', label: isBg ? '3. Баланс и фондове' : '3. Funds & Cashflow', icon: Coins },
          { id: 'workflow', label: isBg ? '4. Месечен работен процес' : '4. Monthly Workflow', icon: Calendar },
          { id: 'faq', label: isBg ? '5. Често задавани въпроси (ЧЗВ)' : '5. FAQs', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all border cursor-pointer",
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: HOW CALCULATIONS WORK */}
      {(activeSection === 'all' || activeSection === 'calc') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isBg ? '1. Как се изчисляват месечните такси на апартаментите' : '1. How Monthly Apartment Dues Are Calculated'}
              </h2>
              <p className="text-xs text-slate-500">
                {isBg 
                  ? 'Точните математически правила и разпределения, заложени в системата' 
                  : 'The exact mathematical rules and proportions built into the system'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rule 1: General Entrance */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-2">
                  <Building2 className="w-4 h-4" />
                  <span>{isBg ? 'Общи разходи вход' : 'General Entrance'}</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  {isBg 
                    ? 'Ток стълбище, асансьор ток, чистач, домофон, кофи за боклук и др. такси за общите части.'
                    : 'Staircase lighting, elevator electricity, cleaning, intercom, waste fees, and entrance upkeep.'}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                <span className="font-bold text-indigo-700 block mb-0.5">{isBg ? 'Формула:' : 'Formula:'}</span>
                Rate = (Σ General - Base) / Total Residents
              </div>
            </div>

            {/* Rule 2: Maintenance */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs mb-2">
                  <Zap className="w-4 h-4" />
                  <span>{isBg ? 'Поддръжка и дворове' : 'Maintenance & Grounds'}</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  {isBg 
                    ? 'Септична яма, почистване на комплекс, градинарство и техническа поддръжка.'
                    : 'Septic servicing, complex cleaning, landscaping, and technical maintenance.'}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                <span className="font-bold text-emerald-700 block mb-0.5">{isBg ? 'Формула:' : 'Formula:'}</span>
                Rate = Σ Maint / Total Residents
              </div>
            </div>

            {/* Rule 3: Garages */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs mb-2">
                  <Car className="w-4 h-4" />
                  <span>{isBg ? 'Гаражи и електроенергия' : 'Garages & Electricity'}</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  {isBg 
                    ? 'Ток за гаражи, автоматични гаражни врати и поддръжка на гаражни клетки.'
                    : 'Garage power consumption, automated gate servicing, and garage maintenance.'}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                <span className="font-bold text-amber-700 block mb-0.5">{isBg ? 'Формула:' : 'Formula:'}</span>
                Rate = Σ Garage / Total Garage Units
              </div>
            </div>

            {/* Rule 4: Repair Fund */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sky-600 font-bold text-xs mb-2">
                  <Percent className="w-4 h-4" />
                  <span>{isBg ? 'Фонд Ремонт (% Ид. части)' : 'Repair Fund (% Co-ownership)'}</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  {isBg 
                    ? 'Разпределя се строго пропорционално според процента идеални части на имота по нотариален акт.'
                    : 'Distributed strictly proportional to the apartment\'s share of common areas (% Ideal Parts).'}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                <span className="font-bold text-sky-700 block mb-0.5">{isBg ? 'Формула:' : 'Formula:'}</span>
                Due = Target × (% Co-ownership Share / 100)
              </div>
            </div>
          </div>

          {/* Master Equation Summary */}
          <div className="bg-indigo-900 text-white rounded-lg p-4 text-xs font-mono flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-indigo-300 font-bold uppercase tracking-wider block mb-1">
                {isBg ? 'Крайна формула за месечната такса на апартамент:' : 'Master Monthly Apartment Due Equation:'}
              </span>
              <p className="text-sm font-bold text-indigo-100">
                Total Due = (Residents × (General + Maint)) + (Garages × GarageRate) + (RepairTarget × %Parts/100) + ElevatorBase + Arrears
              </p>
            </div>
            <div className="bg-white/10 px-3 py-2 rounded text-[11px] text-indigo-200 border border-white/10 text-center">
              {isBg ? 'Автоматично се изчислява в реално време' : 'Automatically calculated in real time'}
            </div>
          </div>

          {/* INTERACTIVE CALCULATION SIMULATOR */}
          <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  {isBg ? 'Интерактивен симулатор на изчислението' : 'Interactive Calculation Simulator'}
                </h3>
              </div>
              <span className="text-[11px] text-indigo-700 font-medium">
                {isBg ? 'Променете стойностите по-долу, за да видите резултата:' : 'Adjust the inputs below to test any scenario:'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {isBg ? 'Живущи (хора)' : 'Residents'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={demoResidents}
                  onChange={(e) => setDemoResidents(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {isBg ? 'Гаражи' : 'Garages'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={demoGarages}
                  onChange={(e) => setDemoGarages(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {isBg ? '% Ид. части' : '% Ideal Parts'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={demoParts}
                  onChange={(e) => setDemoParts(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {isBg ? 'Такса / човек (€)' : 'Rate / Resident (€)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={(demoGeneralRate + demoMaintRate)}
                  onChange={(e) => {
                    const total = parseFloat(e.target.value) || 0;
                    setDemoGeneralRate(total * 0.6);
                    setDemoMaintRate(total * 0.4);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {isBg ? 'Такса / гараж (€)' : 'Rate / Garage (€)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={demoGarageRate}
                  onChange={(e) => setDemoGarageRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {isBg ? 'Стар дълг (€)' : 'Prev. Arrears (€)'}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={demoPrevDebt}
                  onChange={(e) => setDemoPrevDebt(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculated Breakdown Display */}
            <div className="bg-white rounded-lg border border-indigo-200 p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div className="p-2 bg-indigo-50/50 rounded">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {isBg ? 'Живущи такса' : 'Resident Dues'}
                </span>
                <span className="text-sm font-black text-indigo-700">€{demoResidentCost.toFixed(2)}</span>
              </div>

              <div className="p-2 bg-amber-50/50 rounded">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {isBg ? 'Гаражи такса' : 'Garage Dues'}
                </span>
                <span className="text-sm font-black text-amber-700">€{demoGarageCost.toFixed(2)}</span>
              </div>

              <div className="p-2 bg-sky-50/50 rounded">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {isBg ? 'Фонд Ремонт' : 'Repair Fund'}
                </span>
                <span className="text-sm font-black text-sky-700">€{demoRepairCost.toFixed(2)}</span>
              </div>

              <div className="p-2 bg-slate-50 rounded">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  {isBg ? 'Асансьор базова' : 'Elevator Base'}
                </span>
                <span className="text-sm font-black text-slate-700">€{demoElevatorBase.toFixed(2)}</span>
              </div>

              <div className="p-2 bg-emerald-50 rounded col-span-2 md:col-span-1 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                  {isBg ? 'Общо за плащане' : 'Total to Pay'}
                </span>
                <span className="text-base font-black text-emerald-700">€{demoTotalToPay.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FIXED VS VARIABLE BILLS */}
      {(activeSection === 'all' || activeSection === 'bills') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Repeat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isBg ? '2. Постоянни vs. Променливи сметки и обновяване на такси' : '2. Fixed vs. Variable Monthly Bills & Dues Updates'}
              </h2>
              <p className="text-xs text-slate-500">
                {isBg 
                  ? 'Как работят превключвателите Fixed/Variable и бутонът за автоматично изчисляване' 
                  : 'How Fixed/Variable switches operate and how automatic recalculation works'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fixed Bills Card */}
            <div className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-black uppercase rounded bg-indigo-600 text-white shadow-2xs">
                  {isBg ? 'Fixed (Автоматично)' : 'Fixed (Auto-Rollover)'}
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  {isBg ? 'Постоянни разходи с авто-прехвърляне' : 'Fixed Recurring Expenses'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBg
                  ? 'Когато дадена сметка е маркирана с бутон "Fixed", въведената сума автоматично се копира и запазва за следващия месец при натискане на "Следващ месец". Използва се за постоянни абонаменти: чистач, абонамент асансьор, домоуправител, градинар и целева сума за фонд ремонт.'
                  : 'When a bill is toggled as "Fixed", its amount is automatically copied into the new month when clicking "Next Month". Perfect for fixed service agreements: staircase cleaning, elevator maintenance contracts, security, landscaping, and steady repair fund targets.'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-indigo-800 font-semibold bg-indigo-100/60 p-2.5 rounded">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>{isBg ? 'Спестява време от повторно въвеждане всеки месец.' : 'Saves time from re-entering identical bills every month.'}</span>
              </div>
            </div>

            {/* Variable Bills Card */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-black uppercase rounded bg-slate-200 text-slate-700">
                  {isBg ? 'Variable (Нулира се)' : 'Variable (Monthly Reset)'}
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  {isBg ? 'Променливи сметки по фактура' : 'Variable Invoiced Utilities'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBg
                  ? 'Когато дадена сметка е маркирана с бутон "Variable", сумата ѝ автоматично се нулира на 0.00 € за новия месец. Това ви подсказва да въведете новопристигналата фактура за съответния месец (напр. електроенергия стълбище, ток асансьор, извънреден ремонт).'
                  : 'When marked as "Variable", the bill resets to €0.00 in the new month. This prompts you to enter the new utility invoice (e.g. fluctuating staircase power, elevator power, or one-time maintenance repairs).'}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold bg-white p-2.5 rounded border border-slate-200">
                <RotateCcw className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{isBg ? 'Предотвратява грешно таксуване със стара фактура.' : 'Prevents accidental charging with previous invoice numbers.'}</span>
              </div>
            </div>
          </div>

          {/* Calculate & Update Taxes Button Explanation */}
          <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-indigo-500 rounded text-white">
                  <Calculator className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  {isBg ? 'Бутон "Изчисли и обнови таксите"' : 'Calculate & Update Dues Button'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isBg
                  ? 'След като промените сума на сметка, натискането на бутона незабавно преизчислява всички пропорции (такса/живущ, такса/гараж, такса/1% ид. част) и обновява редовете на всички апартаменти.'
                  : 'Whenever you adjust a bill amount, clicking this button instantly distributes the revised rates across every apartment row.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: FUNDS & CASHFLOW */}
      {(activeSection === 'all' || activeSection === 'funds') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isBg ? '3. Проследяване на фондове и касов баланс' : '3. Fund Trackers & Cash Flow Ledger'}
              </h2>
              <p className="text-xs text-slate-500">
                {isBg 
                  ? 'Как се формира крайният баланс, приходите и разходите' 
                  : 'How ending balances, incomes, and expenditures are calculated'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">{isBg ? 'Начален баланс' : 'Starting Balance'}</span>
              <p className="text-xs text-slate-700">
                {isBg
                  ? 'Прехвърля се автоматично от крайния баланс на предходния месец. Може да бъде коригиран ръчно при необходимост.'
                  : 'Auto-carried from the previous month\'s ending balance. Can be directly edited if opening balance adjustments are needed.'}
              </p>
            </div>

            <div className="bg-emerald-50/60 rounded-lg p-4 border border-emerald-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-emerald-800">{isBg ? 'Приходи (Събрани)' : 'Incomes (Collected)'}</span>
              <p className="text-xs text-slate-700">
                {isBg
                  ? 'Всички реално събрани плащания от собствениците (разделени прозрачно на "В брой" и "Revolut").'
                  : 'All payments marked as collected from residents (transparently separated into "Cash" and "Revolut").'}
              </p>
            </div>

            <div className="bg-rose-50/60 rounded-lg p-4 border border-rose-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-rose-800">{isBg ? 'Разходи (Платени сметки)' : 'Expenses (Paid Bills)'}</span>
              <p className="text-xs text-slate-700">
                {isBg
                  ? 'Сумата на всички сметки и динамични разходи, маркирани като "Платени" (Paid) от домоуправителя.'
                  : 'The sum of all monthly bills and dynamic expenses marked as "Paid" by the building manager.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-100 p-4 rounded-lg text-center font-mono text-xs text-slate-800 font-bold border border-slate-200">
            {isBg ? 'Баланс в края на месеца = Начален баланс + Всички събрани приходи - Всички платени разходи' : 'Month-End Balance = Starting Balance + Total Incomes Collected - Total Paid Expenses'}
          </div>
        </div>
      )}

      {/* SECTION 4: MONTHLY WORKFLOW */}
      {(activeSection === 'all' || activeSection === 'workflow') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isBg ? '4. Препоръчителен месечен работен процес за домоуправителя' : '4. Recommended Monthly Workflow for Building Managers'}
              </h2>
              <p className="text-xs text-slate-500">
                {isBg 
                  ? 'Четири лесни стъпки за водене на месечните отчети без грешки' 
                  : 'Four simple steps to manage monthly entrance dues without mistakes'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                step: '01',
                title: isBg ? 'Въвеждане на сметките и фактурите за месеца' : 'Enter Monthly Invoices & Bills',
                desc: isBg
                  ? 'Отворете секция "Месечни сметки и разходи" и попълнете актуалните суми по фактури (ток, чистач, асансьор и др.). Натиснете "Изчисли и обнови таксите".'
                  : 'Open the "Monthly Bills & Utilities" dashboard and update current invoice amounts (power, elevator, cleaner, etc.). Click "Calculate & Update Taxes".'
              },
              {
                step: '02',
                title: isBg ? 'Събиране на таксите и отбелязване на плащанията' : 'Collect Dues & Mark Apartment Payments',
                desc: isBg
                  ? 'При получаване на пари от съсед, маркирайте "Платено" на съответния ред и изберете метод: "В брой" или "Revolut". При непълен превод въведете реалната платена сума.'
                  : 'When receiving money from a neighbor, mark "Paid" on their row and select "Cash" or "Revolut". For partial payments, enter the actual paid sum.'
              },
              {
                step: '03',
                title: isBg ? 'Генериране на справки и печат' : 'Generate Reports & Print',
                desc: isBg
                  ? 'Използвайте меню "Отчети" за генериране на пълен месечен отчет или обобщено съобщение за Viber. Можете да разпечатате таблото за информационното табло във входа.'
                  : 'Use the "Reports" modal to generate full financial statements or Viber announcements. Print the dashboard for the building entrance noticeboard.'
              },
              {
                step: '04',
                title: isBg ? 'Преминаване към нов месец ("Следващ месец")' : 'Transition to the New Month ("Next Month")',
                desc: isBg
                  ? 'В края на месеца натиснете бутона "Следващ месец". Системата автоматично ще прехвърли крайните наличности като начален баланс, ще пренесе неплатените остатъци като стар дълг и ще подготви чист нов месечен формуляр.'
                  : 'At the end of the month, click "Next Month". The system carries over ending fund balances, transfers unpaid dues into starting arrears, and prepares a fresh sheet.'
              }
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center flex-shrink-0 text-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: FAQ & TROUBLESHOOTING */}
      {(activeSection === 'all' || activeSection === 'faq') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isBg ? '5. Често задавани въпроси и отговори (ЧЗВ)' : '5. Frequently Asked Questions (FAQ)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isBg 
                  ? 'Бързи отговори на най-честите казуси при управлението на входа' 
                  : 'Quick solutions for common apartment building management questions'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs md:text-sm text-slate-800 flex items-center justify-between gap-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
