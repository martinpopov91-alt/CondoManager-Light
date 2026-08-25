import { useState } from 'react';
import { Apartment, CalculatedApartmentState } from '../types';
import { cn } from '../utils';
import { Search, AlertTriangle, Bell } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface MainTableProps {
  config: Apartment[];
  apartments: CalculatedApartmentState[];
  onApartmentChange: (id: string, field: keyof CalculatedApartmentState, value: any) => void;
  onConfigChange?: (id: string, field: keyof Apartment, value: any) => void;
  onBulkMarkPaid: () => void;
  onOpenReminderModal?: (id?: string) => void;
}

export function MainTable({ config, apartments, onApartmentChange, onConfigChange, onBulkMarkPaid, onOpenReminderModal }: MainTableProps) {
  const { t, language } = useTranslation();
  const isBg = language === 'bg';
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredApartments = apartments.filter(state => {
    const apt = config.find(a => a.id === state.id);
    if (!apt) return false;
    const term = searchTerm.toLowerCase();
    return apt.id.toLowerCase().includes(term) || 
           apt.owner.toLowerCase().includes(term) || 
           apt.name.toLowerCase().includes(term);
  });

  const selectedCount = apartments.filter(a => a.selected).length;
  const overdueCount = apartments.filter(a => a.status === 'Unpaid' && a.grandTotal > 0 && ((a.monthsInDebt || 0) >= 3 || (a.oldDebt || 0) > 0)).length;

  const handlePaidAmountChange = (state: CalculatedApartmentState, newPaid: number) => {
    onApartmentChange(state.id, 'paidAmount', newPaid);

    if (newPaid > 0) {
      if (newPaid >= state.grandTotal && state.grandTotal > 0) {
        onApartmentChange(state.id, 'status', 'Paid');
      }

      if (newPaid > state.grandTotal && state.grandTotal > 0) {
        const overpaid = newPaid - state.grandTotal;
        const noteText = isBg 
          ? `Надплатени €${overpaid.toFixed(2)} (прехвърлени за следващ месец)`
          : `Overpaid €${overpaid.toFixed(2)} (transferred to next month)`;

        let currentComment = state.comment || '';
        currentComment = currentComment.replace(/;?\s*(Overpaid|Надплатени) €[\d.]+( \([^)]*\))?/gi, '').trim();
        const updatedComment = currentComment ? `${currentComment}; ${noteText}` : noteText;
        onApartmentChange(state.id, 'comment', updatedComment);
      }
    } else if (newPaid === 0) {
      onApartmentChange(state.id, 'status', 'Unpaid');
    }
  };

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden mb-4 flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {t('table.recordsTitle') || 'Apartment Dues & Records'}
        </h3>
        <div className="flex items-center gap-3 print:hidden flex-wrap">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('table.search')}
              className="pl-6 pr-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {overdueCount > 0 && (
            <button
              onClick={() => onOpenReminderModal?.()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold uppercase rounded shadow-sm transition-all whitespace-nowrap cursor-pointer"
              title={isBg ? "Генериране на стандартизирани напомняния за длъжници" : "Generate standardized reminder message for overdue residents"}
            >
              <AlertTriangle className="w-3 h-3" />
              {t('table.overdueReminders') || 'Overdue Reminders'} ({overdueCount})
            </button>
          )}
          {selectedCount > 0 && (
            <button
              onClick={onBulkMarkPaid}
              className="text-xs text-indigo-600 font-bold uppercase hover:underline whitespace-nowrap cursor-pointer"
            >
              {t('table.bulkMarkPaid')} ({selectedCount})
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-left border-collapse min-w-[1050px] print:min-w-0 print:text-[10px]">
          <thead className="bg-slate-50 sticky top-0">
            <tr className="border-b border-slate-200">
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase w-10 sticky left-0 z-10 bg-slate-50 print:hidden">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    filteredApartments.forEach(a => onApartmentChange(a.id, 'selected', checked));
                  }}
                  checked={filteredApartments.length > 0 && filteredApartments.every(a => a.selected)}
                />
              </th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase sticky left-10 z-10 bg-slate-50">{t('table.apt')}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase">{t('table.owner')}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-center">{t('table.idealParts')}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-center">{t('table.people')}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-center">{t('table.garages')}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-right">{t('table.oldDebt') || 'Old Debt'}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-right">{t('table.totalDue')}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-right">{t('table.grandTotal') || 'Grand Total'}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-center">{t('table.status') || 'Status'}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-right">{t('table.paid') || 'Paid Amount'}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-center">{t('table.paymentMethod')}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase">{t('table.notes')}</th>
              <th className="p-2 text-[10px] font-bold text-slate-400 uppercase text-center print:hidden">{t('table.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredApartments.map((state) => {
              const apt = config.find(a => a.id === state.id);
              if (!apt) return null;
              
              const isOverdue = ((state.monthsInDebt || 0) >= 3 || (state.oldDebt || 0) > 0) && state.status !== 'Paid' && state.grandTotal > 0;

              const stickyCellBg = isOverdue
                ? "bg-rose-100/95 text-rose-950"
                : state.status === 'Paid'
                  ? "bg-emerald-50 text-slate-800"
                  : "bg-white text-slate-800";

              return (
                <tr key={state.id} className={cn(
                  "transition-colors", 
                  state.status === 'Paid' ? "bg-emerald-50/30 hover:bg-emerald-50" : "hover:bg-slate-50",
                  isOverdue ? "bg-rose-100/90 hover:bg-rose-200/90 border-l-4 border-l-rose-600 font-medium text-rose-950" : ""
                )}>
                  <td className={cn("p-2 sticky left-0 z-10 print:hidden", stickyCellBg)}>
                    <input 
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={!!state.selected}
                      onChange={(e) => onApartmentChange(state.id, 'selected', e.target.checked)}
                    />
                  </td>
                  <td className={cn("p-2 text-xs font-bold sticky left-10 z-10 flex items-center gap-1", stickyCellBg)}>
                    {isOverdue && (
                      <span 
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white shadow-sm mr-1 whitespace-nowrap"
                        title={isBg ? `Просрочено задължение (${state.monthsInDebt || 1} мес. • €${state.grandTotal.toFixed(2)} общо)` : `Overdue balance (${state.monthsInDebt || 1} months • €${state.grandTotal.toFixed(2)} total due)`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {state.monthsInDebt || 1} {t('table.overdueSuffix') || 'm Overdue'}
                      </span>
                    )}
                    <input
                      type="text"
                      className="w-16 px-1 py-0.5 text-xs font-bold border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded bg-transparent focus:bg-white transition-colors"
                      value={apt.name}
                      onChange={(e) => onConfigChange?.(apt.id, 'name', e.target.value)}
                      placeholder={t('table.aptName') || "Apt Name"}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="w-full min-w-[120px] px-1 py-0.5 text-xs border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded bg-transparent focus:bg-white transition-colors"
                      value={apt.owner}
                      onChange={(e) => onConfigChange?.(apt.id, 'owner', e.target.value)}
                      placeholder={t('table.ownerName')}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      className="w-16 mx-auto px-1 py-0.5 text-xs border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded bg-transparent focus:bg-white text-center block transition-colors"
                      value={apt.idealParts}
                      onChange={(e) => onConfigChange?.(apt.id, 'idealParts', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      className="w-12 mx-auto px-1 py-0.5 text-xs border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded bg-transparent focus:bg-white text-center block transition-colors"
                      value={apt.peopleCount}
                      onChange={(e) => onConfigChange?.(apt.id, 'peopleCount', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      className="w-12 mx-auto px-1 py-0.5 text-xs border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded bg-transparent focus:bg-white text-center block transition-colors"
                      value={apt.garageCount}
                      onChange={(e) => onConfigChange?.(apt.id, 'garageCount', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={cn(
                        "w-16 px-1 py-0.5 text-xs border rounded text-right ml-auto block",
                        isOverdue ? "border-rose-400 bg-rose-50 font-bold text-rose-800" : "border-slate-300 bg-slate-50"
                      )}
                      value={state.oldDebt || ''}
                      onChange={(e) => onApartmentChange(state.id, 'oldDebt', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-2 text-xs text-right font-medium">€{state.currentBill.toFixed(2)}</td>
                  <td className={cn("p-2 text-xs font-bold text-right", isOverdue ? "text-rose-700 font-extrabold text-sm" : "text-slate-900")}>
                    €{state.grandTotal.toFixed(2)}
                  </td>
                  <td className="p-2">
                    <select
                      className={cn(
                        "w-full px-2 py-0.5 text-[10px] font-bold uppercase rounded cursor-pointer text-center",
                        state.status === 'Paid' ? "bg-emerald-100 text-emerald-700" : (isOverdue ? "bg-rose-600 text-white font-extrabold" : "bg-rose-100 text-rose-700")
                      )}
                      value={state.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as 'Paid' | 'Unpaid';
                        onApartmentChange(state.id, 'status', newStatus);
                        if (newStatus === 'Paid') {
                          const currentPaid = state.paidAmount && state.paidAmount > 0 ? state.paidAmount : Math.max(0, state.grandTotal);
                          handlePaidAmountChange(state, currentPaid);
                        } else {
                          onApartmentChange(state.id, 'paidAmount', 0);
                        }
                      }}
                    >
                      <option value="Unpaid">{t('table.statusUnpaid') || 'UNPAID'}</option>
                      <option value="Paid">{t('table.statusPaid') || 'PAID'}</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={cn(
                        "w-20 px-1 py-0.5 text-xs border rounded text-right ml-auto block transition-colors",
                        state.paidAmount && state.paidAmount > state.grandTotal && state.grandTotal > 0
                          ? "border-emerald-500 bg-emerald-100 font-bold text-emerald-900 shadow-xs"
                          : "border-slate-300 bg-slate-50"
                      )}
                      value={
                        state.paidAmount !== undefined && state.paidAmount !== null && state.paidAmount > 0
                          ? state.paidAmount
                          : (state.status === 'Paid' ? (state.grandTotal > 0 ? state.grandTotal : 0) : '')
                      }
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const newPaid = isNaN(val) ? 0 : val;
                        handlePaidAmountChange(state, newPaid);
                      }}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className={cn(
                        "w-full px-2 py-0.5 text-[10px] font-bold uppercase rounded cursor-pointer text-center transition-colors shadow-xs",
                        state.status === 'Paid'
                          ? (state.paymentMethod === 'revolut'
                              ? "bg-sky-100 text-sky-800 border border-sky-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300")
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      )}
                      value={state.paymentMethod || 'cash'}
                      onChange={(e) => onApartmentChange(state.id, 'paymentMethod', e.target.value)}
                    >
                      <option value="cash">💵 {t('table.cash') || 'CASH'}</option>
                      <option value="revolut">💳 {t('table.revolut') || 'REVOLUT'}</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="w-full px-1 py-0.5 text-xs border border-slate-300 rounded bg-slate-50"
                      value={state.comment}
                      onChange={(e) => onApartmentChange(state.id, 'comment', e.target.value)}
                      placeholder={t('table.notes')}
                    />
                  </td>
                  <td className="p-2 text-center print:hidden">
                    <button
                      onClick={() => onOpenReminderModal?.(state.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-extrabold uppercase shadow-sm transition-all whitespace-nowrap cursor-pointer",
                        isOverdue
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      )}
                      title={isBg ? "Генериране на стандартизирано съобщение за напомняне" : "Generate standardized payment reminder message"}
                    >
                      <Bell className="w-3 h-3" />
                      {isOverdue ? (t('table.sendReminder') || 'Send Reminder') : (t('table.remind') || 'Remind')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

