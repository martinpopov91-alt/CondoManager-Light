import { useState, useMemo } from 'react';
import { X, Copy, Check, AlertTriangle, MessageSquare, Users, User, ShieldAlert } from 'lucide-react';
import { Apartment, CalculatedApartmentState, MonthData } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { cn } from '../utils';

interface PaymentReminderModalProps {
  onClose: () => void;
  config: Apartment[];
  apartments: CalculatedApartmentState[];
  initialSelectedId?: string;
  monthData: MonthData;
}

export function PaymentReminderModal({
  onClose,
  config,
  apartments,
  initialSelectedId,
  monthData
}: PaymentReminderModalProps) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'group' | 'individual'>(
    initialSelectedId ? 'individual' : 'group'
  );
  const [msgLang, setMsgLang] = useState<'bg' | 'en'>(language === 'bg' ? 'bg' : 'en');
  const [includeBreakdown, setIncludeBreakdown] = useState(true);
  const [includePaymentNote, setIncludePaymentNote] = useState(true);
  const [copied, setCopied] = useState(false);

  // Filter apartments with overdue balance (monthsInDebt >= 3 or more than 3 months, or having oldDebt)
  const overdueApartments = useMemo(() => {
    return apartments
      .filter(a => a.status === 'Unpaid' && a.grandTotal > 0 && ((a.monthsInDebt || 0) >= 3 || (a.oldDebt || 0) > 0))
      .sort((a, b) => (b.monthsInDebt || 0) - (a.monthsInDebt || 0));
  }, [apartments]);

  // All unpaid apartments as fallback
  const unpaidApartments = useMemo(() => {
    return apartments
      .filter(a => a.status === 'Unpaid' && a.grandTotal > 0)
      .sort((a, b) => (b.monthsInDebt || 0) - (a.monthsInDebt || 0));
  }, [apartments]);

  const displayedApartments = overdueApartments.length > 0 ? overdueApartments : unpaidApartments;

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialSelectedId && displayedApartments.some(a => a.id === initialSelectedId)) {
      return initialSelectedId;
    }
    return displayedApartments[0]?.id || '';
  });

  const selectedApartment = useMemo(() => {
    return apartments.find(a => a.id === selectedId);
  }, [apartments, selectedId]);

  const selectedConfig = useMemo(() => {
    return config.find(c => c.id === selectedId);
  }, [config, selectedId]);

  const totalOverdueAmount = useMemo(() => {
    return displayedApartments.reduce((sum, a) => sum + a.grandTotal, 0);
  }, [displayedApartments]);

  // Generate standardized group notice
  const groupNoticeText = useMemo(() => {
    const isBg = msgLang === 'bg';
    const monthStr = `${monthData.month.toString().padStart(2, '0')}/${monthData.year}`;

    if (displayedApartments.length === 0) {
      return isBg
        ? "🎉 Всички апартаменти са изрядно платени! Няма просрочени задължения."
        : "🎉 All residents are fully paid up! No overdue balances.";
    }

    let text = isBg
      ? `⚠️ ОБЩО ИЗВЕСТИЕ ЗА ПРОСРОЧЕНИ ЗАДЪЛЖЕНИЯ (3+ МЕСЕЦА) – БЛОК 7Д ⚠️\n\n`
      : `⚠️ BUILDING OVERDUE BALANCES NOTICE (3+ MONTHS) – BLOCK 7D ⚠️\n\n`;

    text += isBg
      ? `Уважаеми съседи,\nКъм месец ${monthStr} г. следните апартаменти имат натрупани просрочени задължения към етажната собственост:\n\n`
      : `Dear residents,\nAs of ${monthStr}, the following apartments have overdue balances:\n\n`;

    displayedApartments.forEach(a => {
      const apt = config.find(c => c.id === a.id);
      const name = apt?.name || `Ap. ${a.id}`;
      const owner = apt?.owner ? ` (${apt.owner})` : '';
      const months = a.monthsInDebt || 1;
      const monthsLabel = isBg ? `мес. в просрочие` : `months overdue`;
      let line = `• ${name}${owner} – ${months} ${monthsLabel} | €${a.grandTotal.toFixed(2)} EUR`;
      if ((a.oldDebt || 0) > 0) {
        line += isBg 
          ? ` (вкл. стари такси: €${a.oldDebt.toFixed(2)})`
          : ` (incl. old dues: €${a.oldDebt.toFixed(2)})`;
      }
      text += `${line}\n`;
    });

    text += `\n----------------------------------------\n`;
    text += isBg
      ? `Общо просрочени задължения: €${totalOverdueAmount.toFixed(2)} EUR\n`
      : `Total Overdue Balances: €${totalOverdueAmount.toFixed(2)} EUR\n`;
    const totalOld = displayedApartments.reduce((sum, a) => sum + (a.oldDebt || 0), 0);
    const totalCurrent = displayedApartments.reduce((sum, a) => sum + (a.currentBill || 0), 0);
    if (totalOld > 0) {
      text += isBg
        ? `(от тях текущи такси: €${totalCurrent.toFixed(2)} | стари неплатени: €${totalOld.toFixed(2)})\n`
        : `(current dues: €${totalCurrent.toFixed(2)} | old unpaid taxes: €${totalOld.toFixed(2)})\n`;
    }
    text += `----------------------------------------\n\n`;

    text += isBg
      ? `Моля всички собственици със забавени плащания да погасят задълженията си в най-кратък срок, за да не се затруднява поддръжката и планираните ремонти в сградата.\n\nБлагодарим за разбирането!\nУправление Блок 7Д`
      : `We kindly request all residents with outstanding balances to settle their dues as soon as possible to ensure smooth building maintenance and repair fund continuity.\n\nThank you for your cooperation!\nBlock 7D Management`;

    return text;
  }, [displayedApartments, config, msgLang, monthData.month, monthData.year, totalOverdueAmount]);

  // Generate standardized individual reminder
  const individualReminderText = useMemo(() => {
    if (!selectedApartment || !selectedConfig) {
      return msgLang === 'bg'
        ? "Моля, изберете апартамент от списъка по-горе."
        : "Please select an apartment from the list above.";
    }

    const isBg = msgLang === 'bg';
    const months = selectedApartment.monthsInDebt || 1;
    const name = selectedConfig.name || `Ap. ${selectedApartment.id}`;
    const owner = selectedConfig.owner || (isBg ? 'Собственик' : 'Resident');
    const monthStr = `${monthData.month.toString().padStart(2, '0')}/${monthData.year}`;

    let text = isBg
      ? `⚠️ НАПОМНЯНЕ ЗА НЕПЛАТЕНИ СМЕТКИ – БЛОК 7Д ⚠️\n\n`
      : `⚠️ PAYMENT REMINDER NOTICE – BLOCK 7D ⚠️\n\n`;

    text += isBg
      ? `Здравейте, ${owner} (${name}),\n\nБихме искали учтиво да Ви напомним за натрупани неплатени задължения към етажната собственост на Блок 7Д (към ${monthStr}).\n\n`
      : `Dear ${owner} (${name}),\n\nThis is a polite reminder regarding your overdue balance for Block 7D (as of ${monthStr}).\n\n`;

    text += isBg ? `📊 Справка за задълженията:\n` : `📊 Outstanding Balance Summary:\n`;
    text += isBg
      ? `• Период в просрочие: ${months} месеца\n`
      : `• Months Overdue: ${months} months\n`;

    if (includeBreakdown) {
      text += isBg
        ? `• Текуща месечна сметка: ${selectedApartment.currentBill.toFixed(2)} EUR\n`
        : `• Current Monthly Bill: ${selectedApartment.currentBill.toFixed(2)} EUR\n`;
      if (selectedApartment.oldDebt > 0) {
        text += isBg
          ? `• Старо задължение (преходен дълг): ${selectedApartment.oldDebt.toFixed(2)} EUR\n`
          : `• Previous Unpaid / Old Debt: ${selectedApartment.oldDebt.toFixed(2)} EUR\n`;
      }
    }

    text += isBg
      ? `• ОБЩО ДЪЛЖИМА СУМА: ${selectedApartment.grandTotal.toFixed(2)} EUR\n\n`
      : `• TOTAL OVERDUE DUE: ${selectedApartment.grandTotal.toFixed(2)} EUR\n\n`;

    if (includePaymentNote) {
      text += isBg
        ? `💡 Моля, при възможност да заплатите дължимата сума в най-кратък срок, за да поддържаме нормалното функциониране и ремонтния фонд на сградата.\n\n`
        : `💡 Please arrange payment at your earliest convenience to support building maintenance and repair fund continuity.\n\n`;
    }

    text += isBg
      ? `Ако вече сте извършили плащането, моля да пренебрегнете това съобщение.\n\nБлагодарим Ви за съдействието!\nУправление Блок 7Д`
      : `If you have already made this payment, please disregard this notice.\n\nThank you for your cooperation!\nBlock 7D Management`;

    return text;
  }, [selectedApartment, selectedConfig, msgLang, monthData.month, monthData.year, includeBreakdown, includePaymentNote]);

  const isBgUI = language === 'bg';

  const contentToCopy = activeTab === 'group' ? groupNoticeText : individualReminderText;

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-200" />
            <div>
              <h2 className="text-base font-bold">
                {isBgUI ? 'Стандартизирани напомняния за плащане (Просрочени сметки)' : (t('reminder.modalTitle') || 'Standardized Payment Reminders (Overdue Accounts)')}
              </h2>
              <p className="text-xs text-rose-100">
                {overdueApartments.length > 0
                  ? (isBgUI 
                      ? `${overdueApartments.length} апартамент(а) с просрочие над 3 месеца или стар дълг` 
                      : `${overdueApartments.length} apartment(s) with overdue balance > 3 months or historical debt`)
                  : (isBgUI 
                      ? 'Няма апартаменти с над 3 месеца просрочие. Показване на всички неплатили.' 
                      : 'No apartments > 3 months overdue. Showing all unpaid residents.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-200 hover:text-white rounded-full hover:bg-rose-500/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection & Language Switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-3 bg-slate-50">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('group')}
              className={cn(
                "pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer",
                activeTab === 'group'
                  ? "border-rose-600 text-rose-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <Users className="w-4 h-4" />
              {isBgUI ? 'Общо известие (3+ месеца)' : (t('reminder.tabGroup') || 'Group Notice (3+ Months)')}
              {overdueApartments.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-100 text-rose-700 font-bold">
                  {overdueApartments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('individual')}
              className={cn(
                "pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer",
                activeTab === 'individual'
                  ? "border-rose-600 text-rose-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <User className="w-4 h-4" />
              {isBgUI ? 'Индивидуално напомняне' : (t('reminder.tabIndividual') || 'Individual Resident Reminder')}
            </button>
          </div>

          {/* Language option for message text */}
          <div className="flex items-center gap-1.5 pb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              {isBgUI ? 'Език на текста:' : 'Message Language:'}
            </span>
            <div className="flex rounded-md border border-slate-300 overflow-hidden text-[10px] font-bold">
              <button
                onClick={() => setMsgLang('bg')}
                className={cn(
                  "px-2 py-0.5 transition-colors cursor-pointer",
                  msgLang === 'bg' ? "bg-rose-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                )}
              >
                BG
              </button>
              <button
                onClick={() => setMsgLang('en')}
                className={cn(
                  "px-2 py-0.5 transition-colors cursor-pointer",
                  msgLang === 'en' ? "bg-rose-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                )}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          {activeTab === 'individual' && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">
                  {isBgUI ? 'Избери съсед:' : (t('reminder.selectResident') || 'Select Resident:')}
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                >
                  {displayedApartments.map(a => {
                    const apt = config.find(c => c.id === a.id);
                    const months = a.monthsInDebt || 1;
                    const aptName = apt?.name || `Ап. ${a.id}`;
                    return (
                      <option key={a.id} value={a.id}>
                        {aptName} – {apt?.owner || (isBgUI ? 'Неизвестен' : 'Unknown')} ({months} {isBgUI ? 'м. просрочие' : 'm overdue'} • €{a.grandTotal.toFixed(2)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedApartment && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    {selectedApartment.monthsInDebt || 1} {isBgUI ? 'Месеца просрочие' : 'Months Overdue'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                    {isBgUI ? 'Дължима сума' : 'Due'}: €{selectedApartment.grandTotal.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Options for individual message */}
          {activeTab === 'individual' && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 px-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBreakdown}
                  onChange={(e) => setIncludeBreakdown(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                {isBgUI ? 'Включи разбивка на сумите (Текуща сметка срещу Стар дълг)' : 'Include breakdown of charges (Current vs Old Debt)'}
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePaymentNote}
                  onChange={(e) => setIncludePaymentNote(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                {isBgUI ? 'Включи учтива молба за поддръжка на входа' : 'Include polite building maintenance request'}
              </label>
            </div>
          )}

          {/* Standardized Message Preview Box */}
          <div className="relative flex-1 group min-h-[220px]">
            <div className="w-full h-full p-4 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner overflow-auto">
              {contentToCopy}
            </div>

            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-md shadow-md transition-all flex items-center gap-1.5 text-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{isBgUI ? 'Копирано!' : (t('reminder.copied') || 'Copied!')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{isBgUI ? 'Копирай съобщението' : (t('reminder.copyNotice') || 'Copy Standardized Message')}</span>
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <p>
              {isBgUI 
                ? '💡 Това стандартизирано съобщение е готово за директно поставяне (Paste) във Viber, SMS или имейл.'
                : '💡 This standardized message is ready to paste directly into Viber, SMS, or email.'}
            </p>
            <p className="font-bold">
              {displayedApartments.length} {isBgUI ? 'просрочени сметки общо' : 'overdue accounts total'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
