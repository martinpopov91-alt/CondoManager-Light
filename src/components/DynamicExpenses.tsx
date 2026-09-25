import { DynamicExpense } from '../types';
import { Trash2, PlusCircle, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface DynamicExpensesProps {
  expenses: DynamicExpense[];
  onAdd: (expense: Omit<DynamicExpense, 'id'>) => void;
  onRemove: (id: string) => void;
  onOpenExpensesReport?: () => void;
}

const categories = ['Repair', 'Mowing', 'Septic', 'Complex', 'Other'] as const;

const categoryLabels: Record<'en' | 'bg', Record<string, string>> = {
  en: {
    Repair: 'Repair Fund',
    Mowing: 'Mowing & Grounds',
    Septic: 'Septic Servicing',
    Complex: 'Complex Cleaning',
    Other: 'Other / Extra',
  },
  bg: {
    Repair: 'Фонд Ремонт',
    Mowing: 'Косене и двор',
    Septic: 'Септична яма',
    Complex: 'Комплекс',
    Other: 'Други разходи',
  }
};

export function DynamicExpenses({ expenses, onAdd, onRemove, onOpenExpensesReport }: DynamicExpensesProps) {
  const { t, language } = useTranslation();
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState<DynamicExpense['category']>('Repair');

  const isBg = language === 'bg';

  const handleAdd = () => {
    if (!title || !cost) return;
    onAdd({
      title,
      cost: parseFloat(cost) || 0,
      category,
    });
    setTitle('');
    setCost('');
  };

  return (
    <div className="bg-slate-800 text-white rounded border border-slate-900 shadow-sm p-3.5 mb-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('dynamic.title') || 'One-off & Extra Expenses'}
          </h3>
          {onOpenExpensesReport && (
            <button
              type="button"
              onClick={onOpenExpensesReport}
              className="text-[9px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 bg-slate-700/90 hover:bg-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors border border-slate-600/50"
              title={isBg ? "Отвори пълен отчет за разходите за текущия и предходните месеци" : "View multi-month expenses report"}
            >
              <Receipt className="w-3 h-3 text-indigo-400" />
              <span>{t('reports.openExpensesReport') || (isBg ? 'Отчет за разходите' : 'Expenses Report')}</span>
            </button>
          )}
        </div>
        {expenses.length > 0 && (
          <span className="text-[10px] font-bold text-rose-400">
            -€{expenses.reduce((s, e) => s + e.cost, 0).toFixed(2)}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <input
          type="text"
          placeholder={t('dynamic.titlePlaceholder') || "Expense title..."}
          className="flex-1 px-2.5 py-1.5 text-xs border border-slate-700 bg-slate-900 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder={t('dynamic.costPlaceholder') || "Cost (EUR)"}
          className="w-24 px-2 py-1.5 text-xs border border-slate-700 bg-slate-900 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={cost}
          onChange={e => setCost(e.target.value)}
        />
        <select
          className="w-36 px-2 py-1.5 text-xs border border-slate-700 bg-slate-900 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={category}
          onChange={e => setCategory(e.target.value as any)}
        >
          {categories.map(c => (
            <option key={c} value={c}>
              {categoryLabels[isBg ? 'bg' : 'en'][c] || c}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-xs font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{t('dynamic.add') || 'Add'}</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-auto space-y-2 max-h-56">
        {expenses.length > 0 ? (
          expenses.map(expense => (
            <div key={expense.id} className="bg-slate-700/80 hover:bg-slate-700 p-2.5 rounded relative group transition-colors border border-slate-600/50">
              <div className="text-xs font-bold text-white pr-6">{expense.title}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-300 font-medium">
                  {categoryLabels[isBg ? 'bg' : 'en'][expense.category] || expense.category}
                </span>
                <span className="text-xs font-bold text-rose-400">-€{expense.cost.toFixed(2)}</span>
              </div>
              <button
                onClick={() => onRemove(expense.id)}
                className="absolute top-2 right-2 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                title={isBg ? "Премахни разхода" : "Remove expense"}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-slate-500 text-xs font-medium">
            {t('dynamic.noExpenses') || 'No expenses recorded'}
          </div>
        )}
      </div>
    </div>
  );
}

