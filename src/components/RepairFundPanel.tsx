import { FixedBill } from '../types';
import { Switch } from './ui/Switch';
import { Wrench, Repeat } from 'lucide-react';
import { cn } from '../utils';
import { useTranslation } from '../i18n/useTranslation';

interface RepairFundPanelProps {
  bills: FixedBill[];
  onChange: (id: string, field: 'amount' | 'isPaid' | 'isFixed', value: any) => void;
}

export function RepairFundPanel({ bills, onChange }: RepairFundPanelProps) {
  const { language } = useTranslation();
  const isBg = language === 'bg';
  const repairBill = bills.find(b => b.id === 'repair-fund');
  
  if (!repairBill) return null;

  return (
    <div className="bg-white rounded border border-indigo-200 shadow-sm overflow-hidden p-4 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            {isBg ? 'Месечно събиране за Фонд Ремонт' : 'Monthly Repair Fund Collection'}
          </h3>
        </div>
        
        <p className="text-xs text-slate-500 mb-4">
          {isBg 
            ? 'Посочете общата целева сума за фонд Ремонт за този месец. Разпределя се пропорционално на % Идеални части.'
            : 'Specify the total amount to collect for the repair fund this month. Distributed based on % Ideal Parts.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              {isBg ? 'Обща целева сума' : 'Total Amount'}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-2.5 py-1.5 text-xs border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-medium"
                value={repairBill.amount || ''}
                onChange={(e) => onChange(repairBill.id, 'amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <span className="text-xs text-slate-500 font-bold">EUR</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              {isBg ? 'Авто-прехвърляне за следващ месец' : 'Auto-transfer Next Month'}
            </label>
            <button
              type="button"
              onClick={() => onChange(repairBill.id, 'isFixed', !repairBill.isFixed)}
              title={repairBill.isFixed ? (isBg ? "Постоянна сметка: Сумата се прехвърля автоматично за следващия месец" : "Fixed bill: Amount automatically transfers to the next month") : (isBg ? "Променлива сметка: Нулира се до 0.00 следващия месец" : "Variable bill: Resets to 0.00 next month")}
              className={cn(
                "w-full px-2 py-1.5 text-[10px] font-extrabold uppercase rounded cursor-pointer transition-all flex items-center justify-center gap-1 border select-none",
                repairBill.isFixed
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                  : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
              )}
            >
              <Repeat className="w-3 h-3" />
              <span>{repairBill.isFixed ? (isBg ? "Постоянна (Авто)" : "Fixed (Auto)") : (isBg ? "Променлива" : "Variable")}</span>
            </button>
          </div>

          <div className="flex flex-col gap-1">
             <label className="text-[10px] font-bold text-slate-600 uppercase">
               {isBg ? 'Статус на фонда' : 'Fund Status'}
             </label>
             <div className="flex items-center gap-2 py-1">
               <Switch 
                 checked={repairBill.isPaid} 
                 onChange={(v) => onChange(repairBill.id, 'isPaid', v)} 
               />
               <span className="text-[10px] font-bold text-slate-600">
                 {repairBill.isPaid ? (isBg ? 'Събран' : 'Collected') : (isBg ? 'В очакване' : 'Pending')}
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

