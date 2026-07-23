(function () {
  'use strict';

  const SALES_ORDER = ['REPAINT', 'DETAILING', 'TINT SMITH', 'UNDERCOATING', 'CERAMIC COATING', 'PPF INSTALLATION', 'WASHOVER', 'FULL WASHOVER', 'PMS', 'OTHER SALES', 'PARTS REPLACEMENT'];
  const EXPENSE_ORDER = ['RENTAL', 'TRANSPORTATION', 'COMMUNICATION', 'UTILITIES', 'SALARIES & WAGES', 'CONSTRUCTION', 'SHIPPING', 'MISCELLANEOUS', 'MARKETING', 'SUPPLIES'];
  const peso = '₱#,##0.00';
  const value = input => Number(input || 0);

  function salesCategory(service) {
    const text = String(service || '').toUpperCase();
    if (text.includes('FULL WASH')) return 'FULL WASHOVER';
    if (text.includes('WASH')) return 'WASHOVER';
    if (text.includes('PPF')) return 'PPF INSTALLATION';
    if (text.includes('CERAMIC') || text.includes('GRAPHENE')) return 'CERAMIC COATING';
    if (text.includes('UNDERCOAT')) return 'UNDERCOATING';
    if (text.includes('TINT')) return 'TINT SMITH';
    if (text.includes('DETAIL')) return 'DETAILING';
    if (text.includes('PAINT')) return 'REPAINT';
    if (text.includes('PMS')) return 'PMS';
    return 'OTHER SALES';
  }

  function expenseCategory(type) {
    const text = String(type || '').toUpperCase();
    return EXPENSE_ORDER.find(item => text.includes(item)) || 'MISCELLANEOUS';
  }

  function recordIsSelected(record, start, end) {
    const date = String(record.date || '').slice(0, 10);
    return (!start || date >= start) && (!end || date <= end);
  }

  function loadExcel() {
    if (window.ExcelJS) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function exportReport() {
    const button = document.getElementById('exportExcelReport');
    const start = document.getElementById('exportStart').value;
    const end = document.getElementById('exportEnd').value;
    if (start && end && start > end) {
      alert('End date must be after Start date.');
      return;
    }

    button.disabled = true;
    button.textContent = 'Preparing executive report…';
    try {
      await loadExcel();
      const report = typeof data === 'undefined' ? {} : data;
      const invoices = (report.invoices || []).filter(item => recordIsSelected(item, start, end));
      const expenses = (report.expenses || []).filter(item => recordIsSelected(item, start, end));
      const sales = Object.fromEntries(SALES_ORDER.map(item => [item, 0]));
      const opex = Object.fromEntries(EXPENSE_ORDER.map(item => [item, 0]));
      let costOfSales = 0;

      invoices.forEach(invoice => {
        const lines = invoice.lines && invoice.lines.length ? invoice.lines : [{ service: invoice.service || invoice.description, amount: invoice.amount }];
        lines.forEach(line => { sales[salesCategory(line.service)] += value(line.amount || invoice.amount); });
        (invoice.partsItems || []).forEach(part => { sales['PARTS REPLACEMENT'] += value(part.total || value(part.qty) * value(part.unitPrice)); });
      });
      expenses.forEach(expense => {
        const total = value(expense.amount) * value(expense.qty || 1);
        if (/COST OF SALES/i.test(expense.type || expense.category || '')) costOfSales += total;
        else opex[expenseCategory(expense.type || expense.category)] += total;
      });

      const totalSales = Object.values(sales).reduce((sum, amount) => sum + amount, 0);
      const totalOpex = Object.values(opex).reduce((sum, amount) => sum + amount, 0);
      const grossProfit = totalSales - costOfSales;
      const netIncome = grossProfit - totalOpex;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Executive P&L');
      sheet.mergeCells('A1:F1');
      sheet.getCell('A1').value = '15M AUTOCARE SERVICES';
      sheet.getCell('A1').font = { bold: true, size: 22, color: { argb: 'FFFFFFFF' } };
      sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } };
      sheet.getCell('A1').alignment = { horizontal: 'center' };
      sheet.mergeCells('A2:F2');
      sheet.getCell('A2').value = 'EXECUTIVE PROFIT & LOSS REPORT — ' + (start || 'All dates') + ' to ' + (end || 'Selected period');
      sheet.getCell('A2').font = { bold: true, color: { argb: 'FFFF5A16' } };
      sheet.getCell('A2').alignment = { horizontal: 'center' };
      sheet.getColumn(1).width = 32;
      sheet.getColumn(2).width = 18;

      let rowNumber = 4;
      const row = (label, amount, color) => {
        const current = sheet.getRow(rowNumber++);
        current.getCell(1).value = label;
        if (amount !== null) current.getCell(2).value = amount;
        current.getCell(2).numFmt = peso;
        if (color) {
          current.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          });
        }
      };

      row('SALES', null, 'FFFF5A16');
      SALES_ORDER.forEach(item => row(item, sales[item]));
      row('TOTAL SALES', totalSales, 'FF251D1A');
      row('COST OF SALES', costOfSales, 'FF6A4B3B');
      row('GROSS PROFIT', grossProfit, 'FF1B7F3B');
      row('OPERATING EXPENSES', null, 'FFFF5A16');
      EXPENSE_ORDER.forEach(item => row(item, opex[item]));
      row('TOTAL OPEX', totalOpex, 'FF251D1A');
      row('NET INCOME', netIncome, netIncome >= 0 ? 'FF1B7F3B' : 'FFB42318');

      const salesSheet = workbook.addWorksheet('Sales Details');
      salesSheet.addRow(['DATE', 'CLIENT', 'SERVICE', 'AMOUNT']);
      invoices.forEach(invoice => salesSheet.addRow([invoice.date, invoice.client || invoice.name || '', invoice.service || invoice.description || '', value(invoice.amount)]));
      const expenseSheet = workbook.addWorksheet('Expense Details');
      expenseSheet.addRow(['DATE', 'ITEM', 'TYPE', 'QTY', 'AMOUNT', 'TOTAL']);
      expenses.forEach(expense => expenseSheet.addRow([expense.date, expense.description || expense.item || '', expense.type || expense.category || '', value(expense.qty || 1), value(expense.amount), value(expense.amount) * value(expense.qty || 1)]));
      [salesSheet, expenseSheet].forEach(detailSheet => {
        detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF251D1A' } };
        detailSheet.columns.forEach(column => { column.width = 20; });
      });

      const output = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = '15M-Executive-P-and-L-' + (start || 'Report') + '.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('The report could not be created. Please try again.');
      console.error(error);
    } finally {
      button.disabled = false;
      button.textContent = 'Export Executive Excel';
    }
  }

  function addPanel() {
    if (document.getElementById('exportExcelReport')) return true;
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return false;
    const panel = document.createElement('section');
    panel.id = 'executiveExportPanel';
    panel.style.cssText = 'display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:0 0 18px;padding:14px 16px;border:1px solid #f0c6b3;border-radius:12px;background:#fff7f2';
    panel.innerHTML = '<strong style="width:100%;color:#251d1a">Executive report</strong><label>Start date<input id="exportStart" type="date"></label><label>End date<input id="exportEnd" type="date"></label><button id="exportExcelReport" type="button" style="background:#ff5a16;color:#fff;border:0;border-radius:8px;padding:12px 16px;font-weight:bold">Export Executive Excel</button>';
    dashboard.prepend(panel);
    document.getElementById('exportExcelReport').addEventListener('click', exportReport);
    return true;
  }

  function install(attempt) {
    if (!addPanel() && attempt < 30) setTimeout(() => install(attempt + 1), 300);
  }

  setTimeout(() => install(0), 800);
}());
