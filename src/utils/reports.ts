import { CalculatedApartmentState, MonthData, Apartment, CalculatedFund } from '../types';

export const billNamesDict: Record<'en' | 'bg', Record<string, string>> = {
  en: {
    'el-ent': 'Electricity (Entrance)',
    'el-elev': 'Electricity (Elevator)',
    'el-sub': 'Electricity (Substation)',
    'elev-fee': 'Elevator Maintenance Fee',
    'ent-clean': 'Entrance Cleaning',
    'elev-conn': 'Elevator Connection (Yearly)',
    'tech-insp': 'Technical Inspection (Yearly)',
    'gar-el': 'Garage Electricity',
    'gar-clean': 'Garage Cleaning',
    'maint-mow': 'Mowing & Grounds',
    'maint-septic': 'Septic Servicing',
    'maint-complex': 'Complex Cleaning',
    'repair-fee': 'Repair Fee',
    'repair-fund': 'Repair Fund Collection',
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

export const categoryLabelsDict: Record<'en' | 'bg', Record<string, string>> = {
  en: {
    general: 'Entrance Utilities & Elevator',
    maintenance: 'Maintenance & Grounds (Mowing, Septic)',
    garage: 'Garages & Lighting',
    yearly: 'Annual Contracts & Inspections',
    repair: 'Repair & Renovation Fund',
    Other: 'Other / Extra Outflows',
    Repair: 'Repair Fund',
    Mowing: 'Mowing & Grounds',
    Septic: 'Septic Servicing',
    Complex: 'Complex Cleaning',
  },
  bg: {
    general: 'Общи разходи за входа и асансьор',
    maintenance: 'Поддръжка на двор и общи площи',
    garage: 'Гаражи и осветление',
    yearly: 'Годишни договори и технически прегледи',
    repair: 'Фонд Ремонт и текущи ремонти',
    Other: 'Други извънредни разходи',
    Repair: 'Фонд Ремонт',
    Mowing: 'Косене и двор',
    Septic: 'Септична яма',
    Complex: 'Комплекс почистване',
  }
};

export function generateFullReport(
  monthData: MonthData, 
  apartments: CalculatedApartmentState[], 
  config: Apartment[], 
  funds: CalculatedFund[],
  lang: 'bg' | 'en' = 'bg',
  pastMonths: MonthData[] = []
) {
  const isBg = lang === 'bg';
  const monthStr = `${monthData.month.toString().padStart(2, '0')}/${monthData.year}`;

  let report = isBg
    ? `ФИНАНСОВ ОТЧЕТ – БЛОК 7Д (${monthStr} г.)\n`
    : `BLOCK 7D FINANCE REPORT - ${monthStr}\n`;
  report += `=========================================\n\n`;

  report += isBg ? `📊 КАСОВИ НАЛИЧНОСТИ И ФОНДОВЕ:\n` : `📊 FUNDS & BALANCES:\n`;
  funds.forEach(f => {
    report += `- ${f.name}: €${f.endBalance.toFixed(2)} EUR\n`;
  });
  report += `\n`;

  const curFixedTotal = (monthData.fixedBills || []).reduce((s, b) => s + b.amount, 0);
  const curDynamicTotal = (monthData.dynamicExpenses || []).reduce((s, d) => s + d.cost, 0);
  const curTotalExpenses = curFixedTotal + curDynamicTotal;

  report += isBg ? `🧾 РАЗХОДИ ЗА МЕСЕЦА:\n` : `🧾 MONTHLY EXPENSES:\n`;
  (monthData.fixedBills || []).forEach(b => {
    const statusStr = b.isPaid ? (isBg ? 'Платена' : 'Paid') : (isBg ? 'Неплатена' : 'Unpaid');
    const billName = billNamesDict[lang][b.id] || b.name;
    report += `- ${billName}: €${b.amount.toFixed(2)} EUR (${statusStr})\n`;
  });
  (monthData.dynamicExpenses || []).forEach(d => {
    const catName = categoryLabelsDict[lang][d.category] || d.category;
    report += `- [${catName}] ${d.title}: €${d.cost.toFixed(2)} EUR\n`;
  });
  report += isBg
    ? `Общо разходи за месеца: €${curTotalExpenses.toFixed(2)} EUR (Постоянни сметки: €${curFixedTotal.toFixed(2)} | Извънредни: €${curDynamicTotal.toFixed(2)})\n\n`
    : `Total Monthly Expenses: €${curTotalExpenses.toFixed(2)} EUR (Fixed Bills: €${curFixedTotal.toFixed(2)} | Extra: €${curDynamicTotal.toFixed(2)})\n\n`;

  // Previous Months Expenses Comparison
  if (pastMonths && pastMonths.length > 0) {
    report += isBg 
      ? `📅 СРАВНЕНИЕ НА РАЗХОДИТЕ С ПРЕДХОДНИ МЕСЕЦИ:\n`
      : `📅 PREVIOUS MONTHS EXPENSE COMPARISON:\n`;

    const recentPast = pastMonths.slice(0, 5);
    recentPast.forEach(pm => {
      const pFixed = (pm.fixedBills || []).reduce((s, b) => s + b.amount, 0);
      const pDyn = (pm.dynamicExpenses || []).reduce((s, d) => s + d.cost, 0);
      const pTotal = pFixed + pDyn;
      const pmLabel = `${pm.month.toString().padStart(2, '0')}/${pm.year}`;
      const diff = curTotalExpenses - pTotal;
      const diffStr = diff > 0 ? `+€${diff.toFixed(2)}` : diff < 0 ? `-€${Math.abs(diff).toFixed(2)}` : `€0.00`;
      
      report += isBg
        ? `- ${pmLabel}: €${pTotal.toFixed(2)} EUR (Сметки: €${pFixed.toFixed(2)}, Извънредни: €${pDyn.toFixed(2)}) [Разлика с текущия: ${diffStr}]\n`
        : `- ${pmLabel}: €${pTotal.toFixed(2)} EUR (Bills: €${pFixed.toFixed(2)}, Extra: €${pDyn.toFixed(2)}) [Diff vs current: ${diffStr}]\n`;
    });
    report += `\n`;
  }

  report += isBg ? `🏢 ЗАДЪЛЖЕНИЯ И ПЛАЩАНИЯ ПО АПАРТАМЕНТИ:\n` : `🏢 APARTMENT DUES & PAYMENTS:\n`;
  apartments.forEach(a => {
    const apt = config.find(c => c.id === a.id);
    if (!apt) return;
    const name = apt.name || `Ап. ${apt.id}`;
    report += `${name} (${apt.owner}):\n`;
    report += isBg ? `  - Текуща месечна такса: €${a.currentBill.toFixed(2)} EUR\n` : `  - Current Bill: €${a.currentBill.toFixed(2)} EUR\n`;
    if (a.repairFundShare > 0) {
      report += isBg ? `    - Вкл. дял Фонд Ремонт: €${a.repairFundShare.toFixed(2)} EUR\n` : `    - Included Repair Share: €${a.repairFundShare.toFixed(2)} EUR\n`;
    }
    if (a.oldDebt > 0) {
      report += isBg ? `  - Старо задължение: €${a.oldDebt.toFixed(2)} EUR\n` : `  - Old Debt: €${a.oldDebt.toFixed(2)} EUR\n`;
    }
    report += isBg ? `  - ОБЩО ДЪЛЖИМА СУМА: €${a.grandTotal.toFixed(2)} EUR\n` : `  - GRAND TOTAL: €${a.grandTotal.toFixed(2)} EUR\n`;
    
    const effectivePaid = a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0
      ? a.paidAmount
      : (a.status === 'Paid' ? a.grandTotal : 0);
    if (effectivePaid > 0) {
      report += isBg ? `  - Платена сума: €${effectivePaid.toFixed(2)} EUR\n` : `  - Paid Amount: €${effectivePaid.toFixed(2)} EUR\n`;
    }
    
    const statusLabel = a.status === 'Paid' 
      ? (isBg ? 'ПЛАТЕНО' : 'PAID') 
      : (isBg ? 'НЕПЛАТЕНО' : 'UNPAID');
    const methodLabel = a.paymentMethod === 'revolut' ? 'Revolut' : (isBg ? 'В брой (Каса)' : 'Cash');
    report += isBg ? `  - Статус: ${statusLabel}${a.status === 'Paid' ? ` (${methodLabel})` : ''}\n` : `  - Status: ${statusLabel}${a.status === 'Paid' ? ` (${methodLabel})` : ''}\n`;
    if (a.comment) {
      report += isBg ? `  - Бележка: ${a.comment}\n` : `  - Comment: ${a.comment}\n`;
    }
    report += `\n`;
  });

  return report;
}

export function generateViberGeneral(
  apartments: CalculatedApartmentState[], 
  config: Apartment[], 
  lang: 'bg' | 'en' = 'bg',
  options?: { 
    showOldDebt?: boolean;
    includePaid?: boolean;
    month?: number;
    year?: number;
  }
) {
  const isBg = lang === 'bg';
  const showOldDebt = options?.showOldDebt ?? true;
  const includePaid = options?.includePaid ?? true;

  const bgMonths = [
    'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
    'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
  ];
  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const now = new Date();
  const monthNum = options?.month || (now.getMonth() + 1);
  const yearNum = options?.year || now.getFullYear();
  const monthName = isBg ? bgMonths[monthNum - 1] : enMonths[monthNum - 1];
  const monthStr = `${monthNum.toString().padStart(2, '0')}/${yearNum}`;

  let report = isBg 
    ? `🏢 БЛОК 7Д – МЕСЕЧНО ИЗВЕСТИЕ ЗА ТАКСИ\n📅 Месец: ${monthName} ${yearNum} г. (${monthStr})\n========================================\n\n`
    : `🏢 BLOCK 7D – MONTHLY DUES NOTICE\n📅 Month: ${monthName} ${yearNum} (${monthStr})\n========================================\n\n`;

  const unpaid = apartments.filter(a => a.status === 'Unpaid' && a.grandTotal > 0);
  const paid = apartments.filter(a => a.status === 'Paid' || (a.grandTotal === 0 && a.currentBill === 0));

  let totalCurrentUnpaid = 0;
  let totalOldUnpaid = 0;

  // 1. UNPAID APARTMENTS SECTION
  if (unpaid.length > 0) {
    report += isBg 
      ? `⏳ НЕПЛАТЕНИ ТАКСИ (${unpaid.length}):\n`
      : `⏳ UNPAID DUES (${unpaid.length}):\n`;

    unpaid.forEach(a => {
      const apt = config.find(c => c.id === a.id);
      if (apt) {
        const name = apt.name || `Ап. ${apt.id}`;
        const ownerStr = apt.owner ? ` (${apt.owner})` : '';
        const current = a.currentBill || 0;
        const old = a.oldDebt || 0;
        totalCurrentUnpaid += current;
        totalOldUnpaid += old;

        let line = `• ${name}${ownerStr}: €${a.grandTotal.toFixed(2)} EUR`;

        if (showOldDebt && old > 0) {
          if (current > 0) {
            line += isBg
              ? ` (текуща: €${current.toFixed(2)} + стари такси: €${old.toFixed(2)})`
              : ` (current: €${current.toFixed(2)} + old dues: €${old.toFixed(2)})`;
          } else {
            line += isBg
              ? ` (стари такси: €${old.toFixed(2)})`
              : ` (old dues: €${old.toFixed(2)})`;
          }
        }

        report += `${line}\n`;
      }
    });
    report += `\n`;
  } else {
    report += isBg 
      ? `🎉 Всички апартаменти са изрядно заплатени за месеца! Няма дължими такси.\n\n`
      : `🎉 All apartments have paid their general dues! No outstanding balances.\n\n`;
  }

  // 2. PAID APARTMENTS SECTION
  if (includePaid && paid.length > 0) {
    report += isBg 
      ? `✅ ПЛАТЕНИ ТАКСИ (${paid.length}):\n`
      : `✅ PAID DUES (${paid.length}):\n`;

    paid.forEach(a => {
      const apt = config.find(c => c.id === a.id);
      if (apt) {
        const name = apt.name || `Ап. ${apt.id}`;
        const ownerStr = apt.owner ? ` (${apt.owner})` : '';
        const effectivePaid = (a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0)
          ? a.paidAmount
          : a.grandTotal;

        const methodStr = a.paymentMethod === 'revolut' 
          ? 'Revolut' 
          : (isBg ? 'В брой' : 'Cash');

        if (a.grandTotal === 0 && a.currentBill === 0 && a.oldDebt === 0) {
          report += isBg
            ? `• ${name}${ownerStr}: €0.00 EUR (Освободен)\n`
            : `• ${name}${ownerStr}: €0.00 EUR (Exempt)\n`;
        } else {
          report += `• ${name}${ownerStr}: €${effectivePaid.toFixed(2)} EUR (${methodStr})\n`;
        }
      }
    });
    report += `\n`;
  }

  // 3. MONTHLY SUMMARY SECTION
  const totalUnpaid = unpaid.reduce((sum, a) => sum + a.grandTotal, 0);
  const totalPaid = paid.reduce((sum, a) => {
    const amt = (a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0)
      ? a.paidAmount
      : a.grandTotal;
    return sum + amt;
  }, 0);
  const totalExpected = totalPaid + totalUnpaid;
  const collectionPct = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 100;

  report += `----------------------------------------\n`;
  report += isBg ? `📊 ОБОБЩЕНИЕ ЗА МЕСЕЦА:\n` : `📊 MONTHLY SUMMARY:\n`;
  report += isBg
    ? `• Платени: €${totalPaid.toFixed(2)} EUR (${paid.length} ап. • ${collectionPct}% събираемост)\n`
    : `• Collected (Paid): €${totalPaid.toFixed(2)} EUR (${paid.length} apts • ${collectionPct}% collected)\n`;
  report += isBg 
    ? `• Дължими (неплатени): €${totalUnpaid.toFixed(2)} EUR (${unpaid.length} ап.)\n`
    : `• Outstanding (Unpaid): €${totalUnpaid.toFixed(2)} EUR (${unpaid.length} apts)\n`;

  if (showOldDebt && totalOldUnpaid > 0) {
    report += isBg
      ? `  (от тях текущи такси: €${totalCurrentUnpaid.toFixed(2)} | стари неплатени: €${totalOldUnpaid.toFixed(2)})\n`
      : `  (of which current dues: €${totalCurrentUnpaid.toFixed(2)} | old unpaid taxes: €${totalOldUnpaid.toFixed(2)})\n`;
  }

  report += isBg 
    ? `\nМоля за своевременно заплащане на дължимите такси.\nБлагодарим на всички съседи, които вече заплатиха!`
    : `\nPlease settle outstanding balances promptly.\nThank you to everyone who has already settled their dues!`;

  return report;
}

export function generateExpensesReport(
  currentMonth: MonthData,
  pastMonths: MonthData[],
  lang: 'bg' | 'en' = 'bg',
  limitMonths: number = 6
): string {
  const isBg = lang === 'bg';
  const allMonths = [currentMonth, ...pastMonths].slice(0, limitMonths);
  
  if (allMonths.length === 0) {
    return isBg ? 'Няма налични данни за разходи.' : 'No expense data available.';
  }

  const newest = allMonths[0];
  const oldest = allMonths[allMonths.length - 1];
  const periodLabel = `${oldest.month.toString().padStart(2, '0')}/${oldest.year} – ${newest.month.toString().padStart(2, '0')}/${newest.year}`;

  let report = isBg
    ? `📊 ОТЧЕТ ЗА РАЗХОДИТЕ – ЕТАЖНА СОБСТВЕНОСТ БЛОК 7Д\n`
    : `📊 CONDOMINIUM EXPENSES REPORT - BLOCK 7D\n`;
  report += isBg
    ? `Период: ${periodLabel} (${allMonths.length} ${allMonths.length === 1 ? 'месец' : 'месеца'})\n`
    : `Period: ${periodLabel} (${allMonths.length} ${allMonths.length === 1 ? 'month' : 'months'})\n`;
  report += `=======================================================\n\n`;

  // Compute stats across months
  const monthlyStats = allMonths.map(m => {
    const fixedTotal = (m.fixedBills || []).reduce((s, b) => s + (b.amount || 0), 0);
    const paidFixed = (m.fixedBills || []).filter(b => b.isPaid).reduce((s, b) => s + (b.amount || 0), 0);
    const dynTotal = (m.dynamicExpenses || []).reduce((s, d) => s + (d.cost || 0), 0);
    const total = fixedTotal + dynTotal;
    return {
      month: m.month,
      year: m.year,
      fixedTotal,
      paidFixed,
      dynTotal,
      total,
      bills: m.fixedBills || [],
      dynamics: m.dynamicExpenses || []
    };
  });

  const grandTotalPeriod = monthlyStats.reduce((s, m) => s + m.total, 0);
  const avgMonthly = monthlyStats.length > 0 ? grandTotalPeriod / monthlyStats.length : 0;

  // 1. MONTHLY BREAKDOWN
  report += isBg ? `1. 📈 МЕСЕЧЕН ПРЕГЛЕД НА РАЗХОДИТЕ:\n` : `1. 📈 MONTH-BY-MONTH EXPENSE BREAKDOWN:\n`;
  report += `-------------------------------------------------------\n`;

  monthlyStats.forEach((m, idx) => {
    const isCurrent = idx === 0;
    const mLabel = `${m.month.toString().padStart(2, '0')}/${m.year}`;
    const headerTitle = isCurrent
      ? (isBg ? `• ${mLabel} (Текущ месец)` : `• ${mLabel} (Current Month)`)
      : `• ${mLabel}`;

    report += `${headerTitle}:\n`;
    report += isBg
      ? `  - Регулярни сметки: €${m.fixedTotal.toFixed(2)} EUR (Платени: €${m.paidFixed.toFixed(2)})\n`
      : `  - Recurring Utilities: €${m.fixedTotal.toFixed(2)} EUR (Paid: €${m.paidFixed.toFixed(2)})\n`;

    if (m.dynTotal > 0) {
      report += isBg
        ? `  - Извънредни разходи: €${m.dynTotal.toFixed(2)} EUR (${m.dynamics.length} ${m.dynamics.length === 1 ? 'разход' : 'разхода'})\n`
        : `  - Extra / One-off Expenses: €${m.dynTotal.toFixed(2)} EUR (${m.dynamics.length} ${m.dynamics.length === 1 ? 'item' : 'items'})\n`;
    }

    report += isBg
      ? `  - ОБЩО РАЗХОДИ: €${m.total.toFixed(2)} EUR`
      : `  - TOTAL EXPENSES: €${m.total.toFixed(2)} EUR`;

    // Compare with chronological prior month (idx + 1 in descending list)
    if (idx + 1 < monthlyStats.length) {
      const priorMonth = monthlyStats[idx + 1];
      const diff = m.total - priorMonth.total;
      const pct = priorMonth.total > 0 ? (diff / priorMonth.total) * 100 : 0;
      const sign = diff > 0 ? '+' : '';
      report += isBg
        ? ` [Спрямо предходния: ${sign}€${diff.toFixed(2)} (${sign}${pct.toFixed(1)}%)]\n`
        : ` [vs Prior Month: ${sign}€${diff.toFixed(2)} (${sign}${pct.toFixed(1)}%)]\n`;
    } else {
      report += `\n`;
    }

    // List dynamic items if any
    if (m.dynamics.length > 0) {
      report += isBg ? `    Детайли извънредни разходи:\n` : `    Extra expense details:\n`;
      m.dynamics.forEach(d => {
        const cat = categoryLabelsDict[lang][d.category] || d.category;
        report += `    * [${cat}] ${d.title}: €${d.cost.toFixed(2)} EUR\n`;
      });
    }
    report += `\n`;
  });

  // 2. CATEGORY BREAKDOWN OVER PERIOD
  report += isBg ? `2. 🗂️ РАЗБИВКА ПО КАТЕГОРИИ ЗА ЦЕЛИЯ ПЕРИОД:\n` : `2. 🗂️ CATEGORY BREAKDOWN FOR THE PERIOD:\n`;
  report += `-------------------------------------------------------\n`;

  const categoryTotals: Record<string, number> = {};
  monthlyStats.forEach(m => {
    m.bills.forEach(b => {
      const cat = b.category || 'general';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (b.amount || 0);
    });
    m.dynamics.forEach(d => {
      const cat = d.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (d.cost || 0);
    });
  });

  Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([catKey, total]) => {
      if (total <= 0) return;
      const catLabel = categoryLabelsDict[lang][catKey] || catKey;
      const pct = grandTotalPeriod > 0 ? (total / grandTotalPeriod) * 100 : 0;
      report += `- ${catLabel}: €${total.toFixed(2)} EUR (${pct.toFixed(1)}%)\n`;
    });
  report += `\n`;

  // 3. SUMMARY & KEY INDICATORS
  report += isBg ? `3. 📊 КЛЮЧОВИ ПОКАЗАТЕЛИ:\n` : `3. 📊 KEY INDICATORS:\n`;
  report += `-------------------------------------------------------\n`;
  report += isBg
    ? `• Общо изразходвани средства за периода: €${grandTotalPeriod.toFixed(2)} EUR\n`
    : `• Total Period Expenses: €${grandTotalPeriod.toFixed(2)} EUR\n`;
  report += isBg
    ? `• Средномесечен разход: €${avgMonthly.toFixed(2)} EUR / месец\n`
    : `• Average Monthly Expense: €${avgMonthly.toFixed(2)} EUR / month\n`;

  if (monthlyStats.length > 1) {
    const highest = [...monthlyStats].sort((a, b) => b.total - a.total)[0];
    const lowest = [...monthlyStats].sort((a, b) => a.total - b.total)[0];
    report += isBg
      ? `• Месец с най-висок разход: ${highest.month.toString().padStart(2, '0')}/${highest.year} (€${highest.total.toFixed(2)} EUR)\n`
      : `• Highest Expense Month: ${highest.month.toString().padStart(2, '0')}/${highest.year} (€${highest.total.toFixed(2)} EUR)\n`;
    report += isBg
      ? `• Месец с най-нисък разход: ${lowest.month.toString().padStart(2, '0')}/${lowest.year} (€${lowest.total.toFixed(2)} EUR)\n`
      : `• Lowest Expense Month: ${lowest.month.toString().padStart(2, '0')}/${lowest.year} (€${lowest.total.toFixed(2)} EUR)\n`;
  }

  return report;
}

export function exportExpensesToCSV(
  currentMonth: MonthData,
  pastMonths: MonthData[],
  lang: 'bg' | 'en' = 'bg'
) {
  const isBg = lang === 'bg';
  const allMonths = [currentMonth, ...pastMonths];

  const headers = isBg
    ? ["Година", "Месец", "Вид разход", "Категория", "Наименование", "Сума (EUR)", "Статус", "Бележка"]
    : ["Year", "Month", "Expense Type", "Category", "Item / Bill Name", "Amount (EUR)", "Status", "Notes"];

  const rows: string[] = [];

  allMonths.forEach(m => {
    const monthStr = m.month.toString().padStart(2, '0');
    let mFixedTotal = 0;
    let mDynTotal = 0;

    // Fixed bills
    (m.fixedBills || []).forEach(b => {
      mFixedTotal += (b.amount || 0);
      const billName = billNamesDict[lang][b.id] || b.name;
      const catLabel = categoryLabelsDict[lang][b.category] || b.category;
      const typeLabel = isBg ? "Постоянна сметка" : "Fixed Utility";
      const statusLabel = b.isPaid ? (isBg ? "Платена" : "Paid") : (isBg ? "Неплатена" : "Unpaid");
      rows.push([
        m.year,
        `"${monthStr}"`,
        `"${typeLabel}"`,
        `"${catLabel}"`,
        `"${billName}"`,
        (b.amount || 0).toFixed(2),
        `"${statusLabel}"`,
        `"${b.isFixed ? (isBg ? 'Авто-прехвърляне' : 'Auto-rollover') : ''}"`
      ].join(','));
    });

    // Dynamic expenses
    (m.dynamicExpenses || []).forEach(d => {
      mDynTotal += (d.cost || 0);
      const catLabel = categoryLabelsDict[lang][d.category] || d.category;
      const typeLabel = isBg ? "Извънреден разход" : "One-off / Extra";
      rows.push([
        m.year,
        `"${monthStr}"`,
        `"${typeLabel}"`,
        `"${catLabel}"`,
        `"${d.title.replace(/"/g, '""')}"`,
        (d.cost || 0).toFixed(2),
        `"${isBg ? 'Извършено' : 'Incurred'}"`,
        `""`
      ].join(','));
    });

    // Month subtotal row
    const mTotal = mFixedTotal + mDynTotal;
    const subtotalLabel = isBg ? `ОБЩО ЗА ${monthStr}/${m.year}` : `TOTAL FOR ${monthStr}/${m.year}`;
    rows.push([
      m.year,
      `"${monthStr}"`,
      `"SUBTOTAL"`,
      `"ALL"`,
      `"${subtotalLabel}"`,
      mTotal.toFixed(2),
      `""`,
      `""`
    ].join(','));
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `Condo_7D_Expenses_History_${currentMonth.year}_${currentMonth.month.toString().padStart(2, '0')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToCSV(monthData: MonthData, apartments: CalculatedApartmentState[], config: Apartment[]) {
  const headers = ["Apt ID", "Apt Name", "Owner", "People", "Garages", "Ideal Parts", "Repair Share (EUR)", "Old Debt (EUR)", "Current Bill (EUR)", "Grand Total (EUR)", "Status", "Paid Amount (EUR)", "Payment Method", "Comment"];
  const rows = apartments.map(a => {
    const apt = config.find(c => c.id === a.id);
    const effectivePaid = a.paidAmount !== undefined && a.paidAmount !== null && a.paidAmount > 0
      ? a.paidAmount
      : (a.status === 'Paid' ? a.grandTotal : 0);
    return [
      apt?.id,
      `"${apt?.name || ''}"`,
      `"${apt?.owner || ''}"`,
      apt?.peopleCount,
      apt?.garageCount,
      apt?.idealParts,
      a.repairFundShare.toFixed(2),
      a.oldDebt.toFixed(2),
      a.currentBill.toFixed(2),
      a.grandTotal.toFixed(2),
      a.status,
      effectivePaid.toFixed(2),
      a.paymentMethod || 'cash',
      `"${a.comment || ''}"`
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `Condo_7D_${monthData.year}_${monthData.month.toString().padStart(2, '0')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
