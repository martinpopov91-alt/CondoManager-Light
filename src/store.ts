import { useState, useEffect, useMemo } from 'react';
import { Apartment, MonthData, CalculatedApartmentState, Fund, GitHubCreds } from './types';
import { DEFAULT_APARTMENTS, DEFAULT_FIXED_BILLS, DEFAULT_FUNDS } from './data';
import { useAutoSaveMonthData, usePeriodicSaveMonthData } from './hooks/useAutoSaveMonthData';

export { useAutoSaveMonthData, usePeriodicSaveMonthData };

export const CONFIG_KEY = 'Condo_Config_V1';
export const GH_KEY = 'Condo_GH_Creds';

export function getMonthKey(year: number, month: number) {
  return `condo_${year}-${month.toString().padStart(2, '0')}`;
}

export function getAllSavedMonths(currentYear: number, currentMonth: number): MonthData[] {
  const months: MonthData[] = [];
  const handledKeys = new Set<string>();

  // 1. Direct sequential scan backward for previous 24 months
  let curY = currentYear;
  let curM = currentMonth;
  for (let i = 0; i < 24; i++) {
    curM -= 1;
    if (curM < 1) {
      curM = 12;
      curY -= 1;
    }
    const key = getMonthKey(curY, curM);
    handledKeys.add(key);
    const item = localStorage.getItem(key);
    if (item) {
      try {
        const parsed = JSON.parse(item);
        if (parsed && typeof parsed.year === 'number' && typeof parsed.month === 'number') {
          months.push(parsed);
        }
      } catch (e) {
        // ignore parse error
      }
    }
  }

  // 2. Scan all localStorage keys for any other condo_YYYY-MM
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('condo_') && !key.startsWith('condo_autosave_') && !handledKeys.has(key)) {
        const match = key.match(/^condo_(\d{4})-(\d{2})$/);
        if (match) {
          const y = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          if (y === currentYear && m === currentMonth) continue;
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              if (parsed && typeof parsed.year === 'number' && typeof parsed.month === 'number') {
                months.push(parsed);
              }
            } catch (e) {}
          }
        }
      }
    }
  } catch (e) {}

  // Sort descending by date (most recent first)
  months.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return months;
}

export function seedSamplePreviousMonths(currentYear: number, currentMonth: number, config: Apartment[]): void {
  let y1 = currentYear;
  let m1 = currentMonth - 1;
  if (m1 < 1) { m1 = 12; y1--; }

  let y2 = y1;
  let m2 = m1 - 1;
  if (m2 < 1) { m2 = 12; y2--; }

  const month1Data: MonthData = {
    year: y1,
    month: m1,
    fixedBills: DEFAULT_FIXED_BILLS.map(b => {
      let amount = 0;
      if (b.id === 'el-ent') amount = 34.20;
      else if (b.id === 'el-elev') amount = 28.50;
      else if (b.id === 'el-sub') amount = 12.00;
      else if (b.id === 'elev-fee') amount = 45.00;
      else if (b.id === 'ent-clean') amount = 60.00;
      else if (b.id === 'gar-el') amount = 15.30;
      else if (b.id === 'gar-clean') amount = 25.00;
      else if (b.id === 'maint-mow') amount = 50.00;
      else if (b.id === 'maint-septic') amount = 80.00;
      else if (b.id === 'maint-complex') amount = 30.00;
      else if (b.id === 'repair-fee') amount = 15.00;
      else if (b.id === 'repair-fund') amount = 100.00;
      return { ...b, amount, isPaid: true };
    }),
    dynamicExpenses: [
      { id: 'sample-d1', title: 'Смяна на предпазител и LED крушки на стълбище', cost: 24.50, category: 'Repair' },
      { id: 'sample-d2', title: 'Допълнително косене и почистване на алеите', cost: 35.00, category: 'Mowing' }
    ],
    funds: DEFAULT_FUNDS.map(f => ({ ...f, startBalance: 150 })),
    apartmentsState: config.map(a => ({
      id: a.id,
      oldDebt: 0,
      status: 'Paid',
      paidAmount: 45,
      paymentMethod: 'cash',
      comment: '',
      selected: false
    })),
    revolutCash: 240,
    inHandCash: 180,
    notes: 'Sample month archive for testing reports'
  };

  const month2Data: MonthData = {
    year: y2,
    month: m2,
    fixedBills: DEFAULT_FIXED_BILLS.map(b => {
      let amount = 0;
      if (b.id === 'el-ent') amount = 29.80;
      else if (b.id === 'el-elev') amount = 26.10;
      else if (b.id === 'el-sub') amount = 11.50;
      else if (b.id === 'elev-fee') amount = 45.00;
      else if (b.id === 'ent-clean') amount = 60.00;
      else if (b.id === 'gar-el') amount = 14.20;
      else if (b.id === 'gar-clean') amount = 25.00;
      else if (b.id === 'maint-mow') amount = 50.00;
      else if (b.id === 'maint-septic') amount = 0.00;
      else if (b.id === 'maint-complex') amount = 30.00;
      else if (b.id === 'repair-fund') amount = 100.00;
      return { ...b, amount, isPaid: true };
    }),
    dynamicExpenses: [
      { id: 'sample-d3', title: 'Монтаж на нов хидравличен автомат за входна врата', cost: 65.00, category: 'Repair' }
    ],
    funds: DEFAULT_FUNDS.map(f => ({ ...f, startBalance: 100 })),
    apartmentsState: config.map(a => ({
      id: a.id,
      oldDebt: 0,
      status: 'Paid',
      paidAmount: 45,
      paymentMethod: 'cash',
      comment: '',
      selected: false
    })),
    revolutCash: 200,
    inHandCash: 150,
    notes: 'Sample month archive for testing reports'
  };

  localStorage.setItem(getMonthKey(y1, m1), JSON.stringify(month1Data));
  localStorage.setItem(getMonthKey(y2, m2), JSON.stringify(month2Data));
}

export function clearSamplePreviousMonths(currentYear: number, currentMonth: number): void {
  let y1 = currentYear;
  let m1 = currentMonth - 1;
  if (m1 < 1) { m1 = 12; y1--; }

  let y2 = y1;
  let m2 = m1 - 1;
  if (m2 < 1) { m2 = 12; y2--; }

  localStorage.removeItem(getMonthKey(y1, m1));
  localStorage.removeItem(getMonthKey(y2, m2));
}

export function getCarriedOverFundBalances(year: number, month: number, config: Apartment[]): Record<string, number> {
  let pastMonthsData: MonthData[] = [];
  let curY = year;
  let curM = month;

  for (let i = 0; i < 24; i++) {
    curM -= 1;
    if (curM < 1) {
      curM = 12;
      curY -= 1;
    }
    const pDataStr = localStorage.getItem(getMonthKey(curY, curM));
    if (pDataStr) {
      try {
        pastMonthsData.push(JSON.parse(pDataStr));
      } catch (e) {}
    } else {
      break;
    }
  }

  if (pastMonthsData.length === 0) {
    return {};
  }

  const chronologicalPast = [...pastMonthsData].reverse();
  const runningFundBalances: Record<string, number> = {};

  chronologicalPast.forEach((pMonth, idx) => {
    let totalPeople = 0;
    let totalParts = 0;

    config.forEach(apt => {
      if (apt.id !== '1.3') totalPeople += apt.peopleCount;
      totalParts += apt.idealParts;
    });

    const maintBills = (pMonth.fixedBills || []).filter(b => b.category === 'maintenance');
    const repairFixedBills = (pMonth.fixedBills || []).filter(b => b.category === 'repair');

    const maintTotal = maintBills.reduce((acc, b) => acc + b.amount, 0);
    const repairFixedTotal = repairFixedBills.reduce((acc, b) => acc + b.amount, 0);

    const maintPerPerson = totalPeople > 0 ? maintTotal / totalPeople : 0;
    const repairFixedPerPart = totalParts > 0 ? repairFixedTotal / totalParts : 0;

    const mowingAmount = maintBills.find(b => b.id === 'maint-mow')?.amount || 0;
    const septicAmount = maintBills.find(b => b.id === 'maint-septic')?.amount || 0;
    const complexAmount = maintBills.find(b => b.id === 'maint-complex')?.amount || 0;

    let repairCollected = 0;
    let mowingCollected = 0;
    let septicCollected = 0;
    let complexCollected = 0;

    (pMonth.apartmentsState || []).forEach(state => {
      const apt = config.find(a => a.id === state.id);
      if (!apt) return;

      if (state.status === 'Paid') {
        const isExempt = apt.id === '1.3';
        const myMaint = isExempt ? 0 : (apt.peopleCount * maintPerPerson);
        const myRepairFixed = apt.idealParts * repairFixedPerPart;

        const maintShareFraction = maintTotal > 0 ? myMaint / maintTotal : 0;
        mowingCollected += mowingAmount * maintShareFraction;
        septicCollected += septicAmount * maintShareFraction;
        complexCollected += complexAmount * maintShareFraction;

        repairCollected += myRepairFixed;
      }
    });

    const collectedMap: Record<string, number> = {
      Repair: repairCollected,
      Mowing: mowingCollected,
      Septic: septicCollected,
      Complex: complexCollected,
    };

    const expensesMap: Record<string, number> = {};
    (pMonth.dynamicExpenses || []).forEach(e => {
      expensesMap[e.category] = (expensesMap[e.category] || 0) + e.cost;
    });

    DEFAULT_FUNDS.forEach(df => {
      let startBal = 0;
      if (idx === 0) {
        startBal = pMonth.funds?.find(f => f.id === df.id)?.startBalance || 0;
      } else {
        const found = pMonth.funds?.find(f => f.id === df.id);
        startBal = runningFundBalances[df.id] ?? (found?.startBalance || 0);
      }
      const collected = collectedMap[df.id] || 0;
      const expenses = expensesMap[df.id] || 0;
      runningFundBalances[df.id] = startBal + collected - expenses;
    });
  });

  return runningFundBalances;
}

export function useCondoState() {
  const [config, setConfig] = useState<Apartment[]>([]);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  
  const [monthData, setMonthData] = useState<MonthData | null>(null);

  // Load config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig) as Apartment[];
        
        // Merge missing apartments from defaults but preserve user modifications
        const currentAptIds = new Set(parsedConfig.map(a => a.id));
        const missingApts = DEFAULT_APARTMENTS.filter(a => !currentAptIds.has(a.id));
        
        let newConfig = parsedConfig;
        if (missingApts.length > 0) {
          newConfig = [...parsedConfig, ...missingApts].sort((a, b) => {
            const aParts = a.id.split('.').map(Number);
            const bParts = b.id.split('.').map(Number);
            if (aParts[0] !== bParts[0]) return (aParts[0] || 0) - (bParts[0] || 0);
            return (aParts[1] || 0) - (bParts[1] || 0);
          });
        }

        setConfig(newConfig);
        localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
      } catch (e) {
        setConfig(DEFAULT_APARTMENTS);
      }
    } else {
      setConfig(DEFAULT_APARTMENTS);
      localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_APARTMENTS));
    }
  }, []);

  // Load month data when date changes
  useEffect(() => {
    if (config.length === 0) return;
    const key = getMonthKey(currentDate.year, currentDate.month);
    let savedMonth = localStorage.getItem(key);
    // If regular entry is missing, check for accidental refresh backup snapshot
    if (!savedMonth) {
      const backupKey = `condo_autosave_${currentDate.year}-${currentDate.month.toString().padStart(2, '0')}`;
      const backupStr = localStorage.getItem(backupKey);
      if (backupStr) {
        try {
          const parsedBackup = JSON.parse(backupStr);
          if (parsedBackup && parsedBackup.data) {
            savedMonth = JSON.stringify(parsedBackup.data);
          }
        } catch {
          // ignore parsing error
        }
      }
    }
    const carriedBalances = getCarriedOverFundBalances(currentDate.year, currentDate.month, config);
    
    if (savedMonth) {
      try {
        const parsed = JSON.parse(savedMonth);
        const currentBillIds = new Set(parsed.fixedBills.map((b: any) => b.id));
        const missingBills = DEFAULT_FIXED_BILLS.filter(b => !currentBillIds.has(b.id));
        
        if (missingBills.length > 0) {
          parsed.fixedBills = [
            ...parsed.fixedBills,
            ...missingBills.map(b => ({ ...b, amount: 0, isPaid: false, isFixed: b.isFixed ?? false }))
          ];
        }

        parsed.fixedBills = parsed.fixedBills.map((b: any) => {
          const df = DEFAULT_FIXED_BILLS.find(d => d.id === b.id);
          return {
            ...b,
            category: df ? df.category : b.category,
            isFixed: b.isFixed !== undefined ? b.isFixed : (df?.isFixed ?? false)
          };
        });

        const currentAptIds = new Set(parsed.apartmentsState.map((a: any) => a.id));
        const missingApts = config.filter(c => !currentAptIds.has(c.id));
        if (missingApts.length > 0) {
          parsed.apartmentsState = [
            ...parsed.apartmentsState,
            ...missingApts.map(apt => ({
              id: apt.id,
              oldDebt: 0,
              status: 'Unpaid',
              comment: '',
              selected: false,
            }))
          ];
        }
        
        // Ensure they are sorted
        parsed.apartmentsState.sort((a: any, b: any) => {
          const aParts = a.id.split('.').map(Number);
          const bParts = b.id.split('.').map(Number);
          if (aParts[0] !== bParts[0]) return (aParts[0] || 0) - (bParts[0] || 0);
          return (aParts[1] || 0) - (bParts[1] || 0);
        });

        // Ensure funds have carried over start balance if available
        parsed.funds = DEFAULT_FUNDS.map(df => {
          const existing = (parsed.funds || []).find((f: any) => f.id === df.id);
          const startBal = carriedBalances[df.id] !== undefined ? carriedBalances[df.id] : (existing?.startBalance || 0);
          return {
            ...(existing || df),
            startBalance: startBal
          };
        });

        // If no apartment has oldDebt or payments recorded, seed sample overdue debts for demonstration
        const hasAnyActivity = parsed.apartmentsState.some((a: any) => (a.oldDebt || 0) > 0 || a.status === 'Paid');
        if (!hasAnyActivity) {
          parsed.apartmentsState = parsed.apartmentsState.map((a: any) => {
            if (a.id === '2.6') return { ...a, oldDebt: 180 };
            if (a.id === '1.4') return { ...a, oldDebt: 140 };
            return a;
          });
        }
        
        setMonthData(parsed);
      } catch (e) {
        console.error("Failed to parse month data", e);
      }
    } else {
      // Initialize new month
      const newMonthData: MonthData = {
        year: currentDate.year,
        month: currentDate.month,
        fixedBills: DEFAULT_FIXED_BILLS.map(b => ({ ...b, amount: 0, isPaid: false, isFixed: b.isFixed ?? false })),
        dynamicExpenses: [],
        funds: DEFAULT_FUNDS.map(f => ({
          ...f,
          startBalance: carriedBalances[f.id] ?? 0
        })),
        apartmentsState: config.map(apt => ({
          id: apt.id,
          oldDebt: apt.id === '2.6' ? 180 : (apt.id === '1.4' ? 140 : 0),
          status: 'Unpaid',
          comment: '',
          selected: false,
        }))
      };
      setMonthData(newMonthData);
    }
  }, [currentDate.year, currentDate.month, config]);

  // Periodically save current monthData state to localStorage to prevent data loss on accidental browser refreshes
  const autoSave = useAutoSaveMonthData(monthData, {
    intervalMs: 3000,
    saveOnUnload: true
  });

  const [pastMonthsData, setPastMonthsData] = useState<MonthData[]>([]);

  const reloadPastMonths = () => {
    if (monthData) {
      setPastMonthsData(getAllSavedMonths(monthData.year, monthData.month));
    }
  };

  useEffect(() => {
    if (monthData) {
      setPastMonthsData(getAllSavedMonths(monthData.year, monthData.month));
    }
  }, [monthData?.year, monthData?.month]);

  // Save config on change
  const updateConfig = (newConfig: Apartment[]) => {
    setConfig(newConfig);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
  };

  const updateMonthData = (updater: (prev: MonthData) => MonthData) => {
    setMonthData(prev => {
      if (!prev) return prev;
      return updater(prev);
    });
  };

  const calculatedData = useMemo(() => {
    if (!monthData || config.length === 0) return null;

    let totalPeople = 0;
    let totalGarages = 0;
    let totalParts = 0;

    config.forEach(apt => {
      if (apt.id !== '1.3') {
        totalPeople += apt.peopleCount;
      }
      totalGarages += apt.garageCount;
      totalParts += apt.idealParts;
    });

    const generalBills = monthData.fixedBills.filter(b => b.category === 'general');
    const yearlyBills = monthData.fixedBills.filter(b => b.category === 'yearly');
    const maintBills = monthData.fixedBills.filter(b => b.category === 'maintenance');
    const garageBills = monthData.fixedBills.filter(b => b.category === 'garage');
    const repairFixedBills = monthData.fixedBills.filter(b => b.category === 'repair');

    const generalTotal = generalBills.reduce((acc, b) => acc + b.amount, 0) + 
                         yearlyBills.reduce((acc, b) => acc + (b.amount / 12), 0);
    const maintTotal = maintBills.reduce((acc, b) => acc + b.amount, 0);
    const garageTotal = garageBills.reduce((acc, b) => acc + b.amount, 0);
    const repairFixedTotal = repairFixedBills.reduce((acc, b) => acc + b.amount, 0);

    const generalPerPerson = totalPeople > 0 ? generalTotal / totalPeople : 0;
    const maintPerPerson = totalPeople > 0 ? maintTotal / totalPeople : 0;
    const garagePerCell = totalGarages > 0 ? garageTotal / totalGarages : 0;
    const repairFixedPerPart = totalParts > 0 ? repairFixedTotal / totalParts : 0;

    const mowingAmount = maintBills.find(b => b.id === 'maint-mow')?.amount || 0;
    const septicAmount = maintBills.find(b => b.id === 'maint-septic')?.amount || 0;
    const complexAmount = maintBills.find(b => b.id === 'maint-complex')?.amount || 0;
    
    let repairCollected = 0;
    let mowingCollected = 0;
    let septicCollected = 0;
    let complexCollected = 0;

    let pastMonthsData: MonthData[] = [];
    let curY = monthData.year;
    let curM = monthData.month;
    for (let i = 0; i < 24; i++) {
      curM -= 1;
      if (curM < 1) {
        curM = 12;
        curY -= 1;
      }
      const pData = localStorage.getItem(getMonthKey(curY, curM));
      if (pData) {
        try {
          pastMonthsData.push(JSON.parse(pData));
        } catch(e) {}
      } else {
        break;
      }
    }

    const apartments: CalculatedApartmentState[] = monthData.apartmentsState.map(state => {
      const apt = config.find(a => a.id === state.id);
      if (!apt) return { ...state, currentBill: 0, grandTotal: 0, monthsInDebt: 0, repairFundShare: 0 };

      const isExempt = apt.id === '1.3';
      const myGeneral = isExempt ? 0 : (apt.peopleCount * generalPerPerson);
      const myMaint = isExempt ? 0 : (apt.peopleCount * maintPerPerson);
      const myGarage = apt.garageCount * garagePerCell;
      const myRepairFixed = apt.idealParts * repairFixedPerPart;
      
      const currentBill = myGeneral + myMaint + myGarage + myRepairFixed;
      const grandTotal = currentBill + (state.oldDebt || 0);

      let monthsInDebt = 0;
      if (state.status === 'Unpaid' && grandTotal > 0) {
        monthsInDebt = 1;
        for (const pMonth of pastMonthsData) {
          const pState = pMonth.apartmentsState.find(a => a.id === state.id);
          // Only count if it was unpaid in the past month as well
          if (pState && pState.status === 'Unpaid') {
            monthsInDebt++;
          } else {
            break;
          }
        }
        if ((state.oldDebt || 0) > 0) {
          const baseBill = currentBill > 0 ? currentBill : 45;
          const estimatedOldMonths = Math.round((state.oldDebt || 0) / baseBill);
          monthsInDebt = Math.max(monthsInDebt, 1 + estimatedOldMonths);
        }
      } else if ((state.oldDebt || 0) > 0 && grandTotal > 0) {
        const baseBill = currentBill > 0 ? currentBill : 45;
        monthsInDebt = Math.max(1, Math.round((state.oldDebt || 0) / baseBill));
      }

      if (state.status === 'Paid') {
        const maintShareFraction = maintTotal > 0 ? myMaint / maintTotal : 0;
        mowingCollected += mowingAmount * maintShareFraction;
        septicCollected += septicAmount * maintShareFraction;
        complexCollected += complexAmount * maintShareFraction;

        const repairFixedShareFraction = repairFixedTotal > 0 ? myRepairFixed / repairFixedTotal : 0;
        repairCollected += repairFixedTotal * repairFixedShareFraction; // this is just myRepairFixed effectively
      }
      
      return {
        ...state,
        currentBill,
        grandTotal,
        monthsInDebt,
        repairFundShare: myRepairFixed
      };
    });

    const getDynamicSum = (cat: string) => monthData.dynamicExpenses.filter(e => e.category === cat).reduce((acc, e) => acc + e.cost, 0);

    const carriedBalances = getCarriedOverFundBalances(monthData.year, monthData.month, config);

    const calculatedFunds = monthData.funds.map(f => {
      let collected = 0;
      if (f.id === 'Repair') collected = repairCollected;
      if (f.id === 'Mowing') collected = mowingCollected;
      if (f.id === 'Septic') collected = septicCollected;
      if (f.id === 'Complex') collected = complexCollected;

      const expenses = getDynamicSum(f.id);
      const startBalance = carriedBalances[f.id] !== undefined ? carriedBalances[f.id] : f.startBalance;

      return {
        ...f,
        startBalance,
        collected,
        expenses,
        endBalance: startBalance + collected - expenses
      };
    });

    const revolutCollected = apartments
      .filter(a => a.status === 'Paid' || (a.paidAmount || 0) > 0)
      .filter(a => a.paymentMethod === 'revolut')
      .reduce((acc, a) => {
        const amt = (a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0)
          ? a.paidAmount
          : (a.status === 'Paid' ? Math.max(0, a.grandTotal) : 0);
        return acc + amt;
      }, 0);

    const cashCollected = apartments
      .filter(a => a.status === 'Paid' || (a.paidAmount || 0) > 0)
      .filter(a => a.paymentMethod === 'cash' || !a.paymentMethod)
      .reduce((acc, a) => {
        const amt = (a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0)
          ? a.paidAmount
          : (a.status === 'Paid' ? Math.max(0, a.grandTotal) : 0);
        return acc + amt;
      }, 0);

    const totalMonthlyDues = apartments.reduce((acc, a) => acc + (a.currentBill || 0), 0);

    return {
      apartments,
      funds: calculatedFunds,
      generalPerPerson,
      maintPerPerson,
      garagePerCell,
      repairFixedPerPart,
      totalMonthlyDues,
      revolutCollected,
      cashCollected
    };

  }, [monthData, config]);

  const rollOverMonth = () => {
    if (!monthData || !calculatedData) return;
    
    // new date
    let newYear = monthData.year;
    let newMonth = monthData.month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }

    const newKey = getMonthKey(newYear, newMonth);
    
    const newApartmentsState = monthData.apartmentsState.map(state => {
      const calc = calculatedData.apartments.find(a => a.id === state.id);
      const grandTotal = calc?.grandTotal || 0;

      let effectivePaid = 0;
      if (state.paidAmount !== undefined && state.paidAmount !== null && state.paidAmount > 0) {
        effectivePaid = state.paidAmount;
      } else if (state.status === 'Paid') {
        effectivePaid = Math.max(0, grandTotal);
      }

      const diff = grandTotal - effectivePaid;
      const newOldDebt = Math.round(diff * 100) / 100;

      let nextComment = '';
      if (effectivePaid > grandTotal && grandTotal > 0) {
        const overpayment = effectivePaid - grandTotal;
        nextComment = `Credit from prev month overpayment: €${overpayment.toFixed(2)}`;
      } else if (effectivePaid > 0 && effectivePaid < grandTotal) {
        nextComment = `Unpaid balance from prev month: €${newOldDebt.toFixed(2)}`;
      }

      return {
        ...state,
        oldDebt: newOldDebt,
        status: 'Unpaid' as const,
        paidAmount: 0,
        paymentMethod: 'cash' as const,
        comment: nextComment,
        selected: false
      };
    });

    const newFunds = calculatedData.funds.map(f => ({
      ...f,
      startBalance: f.endBalance
    }));

    const totalEndBalance = calculatedData.funds.reduce((acc, f) => acc + f.endBalance, 0);
    const endRevolut = (monthData.revolutCash || 0) + (calculatedData.revolutCollected || 0);
    const endInHand = Math.max(0, Math.round((totalEndBalance - endRevolut) * 100) / 100);

    const nextMonthData: MonthData = {
      year: newYear,
      month: newMonth,
      fixedBills: monthData.fixedBills.map(b => ({
        ...b,
        amount: b.isFixed ? b.amount : 0,
        isPaid: false
      })),
      dynamicExpenses: [],
      funds: newFunds,
      apartmentsState: newApartmentsState,
      revolutCash: Math.round(endRevolut * 100) / 100,
      inHandCash: endInHand
    };

    localStorage.setItem(newKey, JSON.stringify(nextMonthData));
    setCurrentDate({ year: newYear, month: newMonth });
  };

  return {
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
    reloadPastMonths,
    seedSampleMonths: () => {
      seedSamplePreviousMonths(currentDate.year, currentDate.month, config);
      reloadPastMonths();
    },
    clearSampleMonths: () => {
      clearSamplePreviousMonths(currentDate.year, currentDate.month);
      reloadPastMonths();
    }
  };
}
