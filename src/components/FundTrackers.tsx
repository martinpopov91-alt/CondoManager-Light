import { CalculatedFund, CalculatedApartmentState } from '../types';
import { cn } from '../utils';
import { useTranslation } from '../i18n/useTranslation';
import { EditableCurrencyInput } from './EditableCurrencyInput';

interface FundTrackersProps {
  funds: CalculatedFund[];
  apartments: CalculatedApartmentState[];
  onFundStartBalanceChange?: (fundId: string, newStartBalance: number) => void;
}

const fundTranslations: Record<'en' | 'bg', Record<string, string>> = {
  en: {
    Repair: 'Repair Fund',
    Mowing: 'Mowing Fund',
    Septic: 'Septic Fund',
    Complex: 'Complex Fund',
  },
  bg: {
    Repair: 'Фонд Ремонт',
    Mowing: 'Фонд Косене',
    Septic: 'Фонд Септична яма',
    Complex: 'Фонд Комплекс',
  }
};

export function FundTrackers({ funds, apartments, onFundStartBalanceChange }: FundTrackersProps) {
  const { t, language } = useTranslation();
  const isBg = language === 'bg';
  const totalBalance = funds.reduce((acc, f) => acc + f.endBalance, 0);

  const totalArrears = apartments
    .filter(a => a.status === 'Unpaid')
    .reduce((acc, a) => acc + a.oldDebt, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
      {funds.map((fund) => {
        const net = fund.collected - fund.expenses;
        const netStr = net >= 0 ? `+${net.toFixed(0)}` : net.toFixed(0);
        const fundLabel = fundTranslations[isBg ? 'bg' : 'en'][fund.id] || `${fund.name} ${t('funds.fundSuffix') || 'Fund'}`;

        return (
          <div key={fund.id} className="bg-white p-3 rounded border border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{fundLabel}</span>
              <span className={cn("text-[10px] font-bold", net >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {net !== 0 ? netStr : (t('funds.static') || "Static")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <EditableCurrencyInput
                value={fund.endBalance}
                onChange={(newEnd) => {
                  const newStart = Math.max(0, newEnd - fund.collected + fund.expenses);
                  onFundStartBalanceChange?.(fund.id, newStart);
                }}
                className="text-lg font-bold text-slate-800"
                title={t('funds.editBalanceTitle') || "Click to edit balance in this fund tab"}
              />
              <span className="text-[10px] font-normal text-slate-500 uppercase">EUR</span>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-1/2 rounded-full"></div>
            </div>
          </div>
        );
      })}

      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">{t('app.arrears')}</span>
        </div>
        <div className="text-lg font-bold text-rose-500">
          {totalArrears.toFixed(2)} <span className="text-[10px] font-normal text-slate-400 uppercase">EUR</span>
        </div>
        <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
          <div className="bg-rose-500 h-full w-full rounded-full"></div>
        </div>
      </div>

      <div className="bg-slate-800 p-3 rounded border border-slate-900 shadow-sm text-white">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">{t('app.totalBalance')}</span>
        </div>
        <div className="text-lg font-bold text-emerald-400">
          {totalBalance.toFixed(2)} <span className="text-[10px] font-normal text-emerald-600 uppercase">EUR</span>
        </div>
        <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-full rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

