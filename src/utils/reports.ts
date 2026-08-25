import { CalculatedApartmentState, MonthData, Apartment, CalculatedFund } from '../types';

export function generateFullReport(
  monthData: MonthData, 
  apartments: CalculatedApartmentState[], 
  config: Apartment[], 
  funds: CalculatedFund[],
  lang: 'bg' | 'en' = 'bg'
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

  report += isBg ? `🧾 РАЗХОДИ ЗА МЕСЕЦА:\n` : `🧾 MONTHLY EXPENSES:\n`;
  monthData.fixedBills.forEach(b => {
    const statusStr = b.isPaid ? (isBg ? 'Платена' : 'Paid') : (isBg ? 'Неплатена' : 'Unpaid');
    report += `- ${b.name}: €${b.amount.toFixed(2)} EUR (${statusStr})\n`;
  });
  monthData.dynamicExpenses.forEach(d => {
    report += `- [${d.category}] ${d.title}: €${d.cost.toFixed(2)} EUR\n`;
  });
  report += `\n`;

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

export function generateViberGeneral(apartments: CalculatedApartmentState[], config: Apartment[], lang: 'bg' | 'en' = 'bg') {
  const isBg = lang === 'bg';
  const unpaid = apartments.filter(a => a.status === 'Unpaid' && a.grandTotal > 0);
  if (unpaid.length === 0) {
    return isBg 
      ? "🎉 Всички апартаменти са изрядно заплатени за месеца! Няма дължими такси."
      : "🎉 All apartments have paid their general dues! No outstanding balances.";
  }

  let report = isBg ? `🏢 Блок 7Д – Неплатени такси за месеца\n\n` : `🏢 Block 7D - Unpaid Dues\n\n`;
  unpaid.forEach(a => {
    const apt = config.find(c => c.id === a.id);
    if (apt) {
      const name = apt.name || `Ап. ${apt.id}`;
      report += `• ${name} (${apt.owner}): €${a.grandTotal.toFixed(2)} EUR\n`;
    }
  });

  const totalUnpaid = unpaid.reduce((sum, a) => sum + a.grandTotal, 0);
  report += isBg 
    ? `\nОбщо дължима сума: €${totalUnpaid.toFixed(2)} EUR\nМоля за своевременно заплащане на таксите.`
    : `\nTotal Outstanding: €${totalUnpaid.toFixed(2)} EUR\nPlease settle outstanding balances promptly.`;

  return report;
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

