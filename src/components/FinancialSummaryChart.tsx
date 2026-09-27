import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../i18n/useTranslation';
import { useTheme } from '../theme/useTheme';

interface FinancialSummaryChartProps {
  collected: number;
  unpaid: number;
  fixedExpenses: number;
  dynamicExpenses: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-md p-2 text-xs font-bold text-slate-800 dark:text-slate-100">
        <p className="text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => {
          if (entry.value > 0) {
            return (
              <div key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
                <span>{entry.name}:</span>
                <span>{entry.value.toFixed(2)} EUR</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }
  return null;
};

export function FinancialSummaryChart({ collected, unpaid, fixedExpenses, dynamicExpenses }: FinancialSummaryChartProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const collectedLabel = t('chart.collected' as any) || 'Collected (Paid)';
  const unpaidLabel = t('chart.unpaid' as any) || 'Expected (Unpaid)';
  const fixedLabel = t('chart.fixed' as any) || 'Fixed Bills';
  const dynamicLabel = t('chart.dynamic' as any) || 'Other Expenses';

  const data = [
    {
      name: t('chart.income' as any) || 'Income',
      [collectedLabel]: collected,
      [unpaidLabel]: unpaid,
      [fixedLabel]: 0,
      [dynamicLabel]: 0,
    },
    {
      name: t('chart.expenses' as any) || 'Expenses',
      [collectedLabel]: 0,
      [unpaidLabel]: 0,
      [fixedLabel]: fixedExpenses,
      [dynamicLabel]: dynamicExpenses,
    }
  ];

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const cursorColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc';

  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-sm p-4 print:shadow-none print:border-slate-300 print:break-inside-avoid transition-colors">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
        {t('chart.title' as any) || 'Detailed Monthly Summary'}
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorColor }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey={collectedLabel} stackId="a" fill="#34d399" maxBarSize={60} />
            <Bar dataKey={unpaidLabel} stackId="a" fill="#fbbf24" maxBarSize={60} />
            <Bar dataKey={fixedLabel} stackId="a" fill="#818cf8" maxBarSize={60} />
            <Bar dataKey={dynamicLabel} stackId="a" fill="#f43f5e" maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
