/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useCondoState } from './store';
import { Layout } from './components/Layout';
import { FundTrackers } from './components/FundTrackers';
import { FixedBills } from './components/FixedBills';
import { MainTable } from './components/MainTable';
import { DynamicExpenses } from './components/DynamicExpenses';
import { FinancialSummaryChart } from './components/FinancialSummaryChart';
import { InstructionsTab } from './components/InstructionsTab';
import { ReportsModal } from './components/ReportsModal';
import { SettingsModal } from './components/SettingsModal';
import { PaymentReminderModal } from './components/PaymentReminderModal';
import { generateFullReport, generateViberGeneral, exportToCSV } from './utils/reports';
import { CloudUpload, CloudDownload, RefreshCw, X, Printer, Check } from 'lucide-react';
import { useTranslation } from './i18n/useTranslation';
import { EditableCurrencyInput } from './components/EditableCurrencyInput';

export default function App() {
  const { t, language } = useTranslation();
  const isBg = language === 'bg';
  const {
    config,
    updateConfig,
    currentDate,
    setCurrentDate,
    monthData,
    updateMonthData,
    calculatedData,
    rollOverMonth,
    autoSave,
    pastMonthsData,
    seedSampleMonths,
    clearSampleMonths
  } = useCondoState();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'instructions'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reportsInitialTab, setReportsInitialTab] = useState<'expenses' | 'full' | 'viberGeneral'>('expenses');
  const [showSync, setShowSync] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<string | undefined>(undefined);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleOpenReports = (tab: 'expenses' | 'full' | 'viberGeneral' = 'expenses') => {
    setReportsInitialTab(tab);
    setShowReports(true);
  };

  if (!monthData || !calculatedData) {
    return <div className="flex items-center justify-center min-h-screen text-slate-500">{isBg ? 'Зареждане...' : 'Loading...'}</div>;
  }

  const handlePrevMonth = () => {
    let y = currentDate.year;
    let m = currentDate.month - 1;
    if (m < 1) { m = 12; y--; }
    setCurrentDate({ year: y, month: m });
  };

  const handleNextMonth = () => {
    let y = currentDate.year;
    let m = currentDate.month + 1;
    if (m > 12) { m = 1; y++; }
    setCurrentDate({ year: y, month: m });
  };

  const handleFixedBillChange = (id: string, field: 'amount' | 'isPaid' | 'isFixed', value: any) => {
    updateMonthData(prev => ({
      ...prev,
      fixedBills: prev.fixedBills.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const handleApartmentChange = (id: string, field: string, value: any) => {
    updateMonthData(prev => ({
      ...prev,
      apartmentsState: prev.apartmentsState.map(a => a.id === id ? { ...a, [field]: value } : a)
    }));
  };

  const handleBulkMarkPaid = () => {
    updateMonthData(prev => ({
      ...prev,
      apartmentsState: prev.apartmentsState.map(a => {
        if (a.selected) {
          return { ...a, status: 'Paid' as const, paymentMethod: a.paymentMethod || 'cash', selected: false };
        }
        return a;
      })
    }));
  };

  const handleAddDynamicExpense = (exp: any) => {
    const newExp = { ...exp, id: Math.random().toString(36).substring(7) };
    updateMonthData(prev => ({
      ...prev,
      dynamicExpenses: [...prev.dynamicExpenses, newExp]
    }));
  };

  const handleRemoveDynamicExpense = (id: string) => {
    updateMonthData(prev => ({
      ...prev,
      dynamicExpenses: prev.dynamicExpenses.filter(e => e.id !== id)
    }));
  };

  const handleInHandChange = (val: number) => {
    updateMonthData(prev => {
      const targetInHandBase = Math.max(0, Math.round((val - (calculatedData.cashCollected || 0)) * 100) / 100);
      return {
        ...prev,
        inHandCash: targetInHandBase
      };
    });
  };

  const handleRevolutChange = (val: number) => {
    updateMonthData(prev => {
      const targetRevolutBase = Math.max(0, Math.round((val - (calculatedData.revolutCollected || 0)) * 100) / 100);
      return {
        ...prev,
        revolutCash: targetRevolutBase
      };
    });
  };

  const handleTotalCashChange = (val: number) => {
    updateMonthData(prev => {
      const numFunds = prev.funds.length || 4;
      const baseShare = Math.floor((val / numFunds) * 100) / 100;
      const remainder = Math.round((val - baseShare * (numFunds - 1)) * 100) / 100;

      return {
        ...prev,
        funds: prev.funds.map((f, idx) => {
          const newStart = idx === 0 ? remainder : baseShare;
          return {
            ...f,
            startBalance: newStart
          };
        })
      };
    });
  };

  const handleFundStartBalanceChange = (fundId: string, newStartBalance: number) => {
    updateMonthData(prev => {
      const updatedFunds = prev.funds.map(f => f.id === fundId ? { ...f, startBalance: newStartBalance } : f);
      return {
        ...prev,
        inHandCash: undefined,
        funds: updatedFunds
      };
    });
  };

  const handleOpenReminder = (id?: string) => {
    setSelectedReminderId(id);
    setShowReminders(true);
  };

  const syncToGitHub = async (action: 'push' | 'pull') => {
    setSyncStatus(isBg ? `Стартиране на ${action === 'push' ? 'качване (Push)' : 'сваляне (Pull)'}...` : `Starting ${action}...`);
    const credsStr = localStorage.getItem('Condo_GH_Creds');
    if (!credsStr) {
      setSyncStatus(isBg ? 'Грешка: Липсват GitHub данни. Моля, задайте ги в Настройки.' : 'Error: GitHub credentials not found. Please set them in Settings.');
      return;
    }
    try {
      const creds = JSON.parse(credsStr);
      if (!creds.token || !creds.gistId) {
        setSyncStatus(isBg ? 'Грешка: Невалидни GitHub данни за вход.' : 'Error: Invalid GitHub credentials.');
        return;
      }

      const gistUrl = `https://api.github.com/gists/${creds.gistId}`;
      const headers = {
        'Authorization': `token ${creds.token}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      const filename = `condo_${monthData.year}-${monthData.month.toString().padStart(2, '0')}.json`;

      if (action === 'push') {
        const payload = {
          files: {
            [filename]: {
              content: JSON.stringify(monthData, null, 2)
            }
          }
        };
        const res = await fetch(gistUrl, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(isBg ? 'Неуспешно качване към Gist' : 'Failed to push to Gist');
        setSyncStatus(isBg ? 'Успешно качено в GitHub!' : 'Successfully pushed to GitHub!');
      } else {
        const res = await fetch(gistUrl, { headers });
        if (!res.ok) throw new Error(isBg ? 'Неуспешно изтегляне от Gist' : 'Failed to fetch from Gist');
        const data = await res.json();
        const file = data.files[filename];
        if (file && file.content) {
          const fetchedData = JSON.parse(file.content);
          updateMonthData(() => fetchedData);
          setSyncStatus(isBg ? 'Успешно изтеглено от GitHub!' : 'Successfully pulled from GitHub!');
        } else {
          setSyncStatus(isBg ? `Грешка: Файлът ${filename} не е намерен в Gist.` : `Error: File ${filename} not found in Gist.`);
        }
      }
    } catch (e: any) {
      setSyncStatus(`${isBg ? 'Грешка' : 'Error'}: ${e.message}`);
    }
    setTimeout(() => { if (syncStatus?.includes('Успешно') || syncStatus?.includes('Successfully')) setShowSync(false); }, 2000);
  };

  const totalCash = calculatedData.funds.reduce((acc, f) => acc + f.endBalance, 0);
  const displayRevolut = Math.round(((monthData.revolutCash || 0) + (calculatedData.revolutCollected || 0)) * 100) / 100;
  const displayInHand = Math.round(((monthData.inHandCash || 0) + (calculatedData.cashCollected || 0)) * 100) / 100;

  const totalArrears = calculatedData.apartments
    .filter(a => a.status === 'Unpaid')
    .reduce((acc, a) => acc + a.oldDebt, 0);

  const totalExpected = calculatedData.apartments.reduce((acc, a) => acc + a.grandTotal, 0);
  const totalCollected = calculatedData.apartments
    .filter(a => a.status === 'Paid')
    .reduce((acc, a) => acc + a.grandTotal, 0);
  const totalUnpaid = totalExpected - totalCollected;

  const totalFixedExpenses = monthData.fixedBills.filter(b => b.isPaid).reduce((acc, b) => acc + b.amount, 0);
  const totalDynamicExpenses = monthData.dynamicExpenses.reduce((acc, e) => acc + e.cost, 0);

  return (
    <Layout
      year={currentDate.year}
      month={currentDate.month}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
      onOpenSettings={() => setShowSettings(true)}
      onReports={() => handleOpenReports('expenses')}
      onExport={() => exportToCSV(monthData, calculatedData.apartments, config)}
      onSync={() => { setShowSync(true); setSyncStatus(null); }}
    >
      {activeTab === 'instructions' ? (
        <InstructionsTab onGoToDashboard={() => setActiveTab('dashboard')} />
      ) : (
        <div className="max-w-[1800px] w-full mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800 print:hidden">{t('app.financialDashboard')}</h2>
              {/* Auto-save status indicator */}
              <div className="print:hidden">
                {autoSave.isSaving ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    {t('app.autoSaving')}
                  </span>
                ) : autoSave.saveStatus === 'error' ? (
                  <button
                    onClick={autoSave.forceSave}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                  >
                    <span>{isBg ? 'Грешка при запис (Опитай пак)' : 'Save Error (Click to retry)'}</span>
                  </button>
                ) : autoSave.hasUnsavedChanges ? (
                  <button
                    onClick={autoSave.forceSave}
                    title={isBg ? "Кликнете за незабавно запазване" : "Click to save immediately"}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {t('app.unsavedChanges')}
                  </button>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                    title={autoSave.lastSaved ? (isBg ? `Последно автоматично запазване в ${autoSave.lastSaved.toLocaleTimeString()}` : `Last auto-saved at ${autoSave.lastSaved.toLocaleTimeString()}`) : undefined}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('app.autoSaved')}</span>
                  </span>
                )}
              </div>
            </div>
          
          <div className="flex items-center gap-4 bg-slate-900 text-white rounded-lg px-4 py-2 shadow-sm print:bg-white print:text-slate-800 print:border print:border-slate-300 print:shadow-none">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('app.totalBalance')}</span>
              <div className="flex items-center">
                <EditableCurrencyInput
                  value={totalCash}
                  onChange={handleTotalCashChange}
                  className="text-sm font-bold text-emerald-400 print:text-slate-800"
                  title={isBg ? "Кликнете за редакция на общите средства (разпределя се по фондове)" : "Click to edit total cash (distributes across tabs)"}
                />
                <span className="text-xs font-bold text-emerald-400 ml-1 print:text-slate-800">EUR</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700 print:bg-slate-300"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('app.revolut')}</span>
              <div className="flex items-center">
                <EditableCurrencyInput
                  value={displayRevolut}
                  onChange={handleRevolutChange}
                  className="text-sm font-bold text-sky-400 print:text-slate-800"
                  title={isBg ? "Кликнете за редакция на наличността в Revolut" : "Click to edit Revolut balance"}
                />
                <span className="text-xs font-bold text-sky-400 ml-1 print:text-slate-800">EUR</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700 print:bg-slate-300"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('app.inHand')}</span>
              <div className="flex items-center">
                <EditableCurrencyInput
                  value={displayInHand}
                  onChange={handleInHandChange}
                  className="text-sm font-bold text-amber-400 print:text-slate-800"
                  title={isBg ? "Кликнете за редакция на парите в брой (каса)" : "Click to edit cash in hand"}
                />
                <span className="text-xs font-bold text-amber-400 ml-1 print:text-slate-800">EUR</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700 print:bg-slate-300"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('app.arrears')}</span>
              <span className="text-sm font-bold text-rose-500 print:text-slate-800">{totalArrears.toFixed(2)} EUR</span>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-medium text-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> {t('app.print')}
            </button>
            <button
              onClick={rollOverMonth}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-medium text-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> {t('app.nextMonth')}
            </button>
          </div>
        </div>

        <FundTrackers
          funds={calculatedData.funds}
          apartments={calculatedData.apartments}
          onFundStartBalanceChange={handleFundStartBalanceChange}
        />
        
        <FixedBills 
          bills={monthData.fixedBills} 
          onChange={handleFixedBillChange}
          rates={{
            generalPerPerson: calculatedData.generalPerPerson,
            maintPerPerson: calculatedData.maintPerPerson,
            garagePerCell: calculatedData.garagePerCell,
            repairFixedPerPart: calculatedData.repairFixedPerPart,
            totalMonthlyDues: calculatedData.totalMonthlyDues
          }}
          onRecalculate={() => {
            updateMonthData(prev => ({ ...prev }));
          }}
          onOpenExpensesReport={() => handleOpenReports('expenses')}
        />
        
        <MainTable 
          config={config} 
          apartments={calculatedData.apartments} 
          onApartmentChange={handleApartmentChange}
          onConfigChange={(id, field, value) => {
            const newConfig = config.map(a => a.id === id ? { ...a, [field]: value } : a);
            updateConfig(newConfig);
          }}
          onBulkMarkPaid={handleBulkMarkPaid}
          onOpenReminderModal={handleOpenReminder}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <FinancialSummaryChart 
              collected={totalCollected} 
              unpaid={totalUnpaid}
              fixedExpenses={totalFixedExpenses}
              dynamicExpenses={totalDynamicExpenses}
            />
          </div>

          <div className="lg:col-span-1">
            <DynamicExpenses 
              expenses={monthData.dynamicExpenses} 
              onAdd={handleAddDynamicExpense} 
              onRemove={handleRemoveDynamicExpense} 
              onOpenExpensesReport={() => handleOpenReports('expenses')}
            />
          </div>

          <div className="lg:col-span-1 bg-white rounded border border-slate-200 shadow-sm p-4 print:shadow-none print:border-slate-300 print:break-inside-avoid">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">{t('app.monthlyNotes')}</h3>
            <textarea
              className="w-full h-48 p-3 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y print:border-none print:p-0 print:resize-none"
              placeholder={t('app.monthlyNotesPlaceholder')}
              value={monthData.notes || ''}
              onChange={(e) => updateMonthData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>

        {/* Signature Line Area for Building Manager (Print View Only) */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-8 px-4 break-inside-avoid border-t border-slate-300">
          <div className="flex flex-col gap-1.5 w-64">
            <div className="border-b border-slate-400 h-8"></div>
            <span className="text-[11px] font-bold text-slate-700 text-center uppercase tracking-wider">{t('app.signatureManager')}</span>
          </div>
          <div className="flex flex-col gap-1.5 w-48">
            <div className="border-b border-slate-400 h-8 flex items-end justify-center pb-1">
              <span className="text-xs text-slate-800 font-medium">
                {new Date().toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-700 text-center uppercase tracking-wider">{t('app.signatureDate')}</span>
          </div>
        </div>
      </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      
      {showReports && (
        <ReportsModal 
          onClose={() => setShowReports(false)}
          monthData={monthData}
          apartments={calculatedData.apartments}
          config={config}
          funds={calculatedData.funds}
          pastMonthsData={pastMonthsData}
          initialTab={reportsInitialTab}
          onSeedSampleMonths={seedSampleMonths}
          onClearSampleMonths={clearSampleMonths}
        />
      )}

      {showReminders && (
        <PaymentReminderModal
          onClose={() => {
            setShowReminders(false);
            setSelectedReminderId(undefined);
          }}
          config={config}
          apartments={calculatedData.apartments}
          initialSelectedId={selectedReminderId}
          monthData={monthData}
        />
      )}

      {showSync && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col p-6 relative">
            <button onClick={() => setShowSync(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {isBg ? 'GitHub Синхронизация' : 'GitHub Sync'}
            </h2>
            <div className="flex gap-4 mb-4">
              <button onClick={() => syncToGitHub('push')} className="flex-1 flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors text-slate-700 cursor-pointer">
                <CloudUpload className="w-6 h-6 text-indigo-600" />
                <span className="font-bold text-xs uppercase">{isBg ? 'Качи данни (Push)' : 'Push Data'}</span>
              </button>
              <button onClick={() => syncToGitHub('pull')} className="flex-1 flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50 transition-colors text-slate-700 cursor-pointer">
                <CloudDownload className="w-6 h-6 text-emerald-600" />
                <span className="font-bold text-xs uppercase">{isBg ? 'Свали данни (Pull)' : 'Pull Data'}</span>
              </button>
            </div>
            {syncStatus && (
              <div className="p-3 bg-slate-100 rounded-md text-xs text-slate-700 font-bold text-center">
                {syncStatus}
              </div>
            )}
          </div>
        </div>
      )}

    </Layout>
  );
}


