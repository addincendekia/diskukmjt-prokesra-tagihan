function _checkInstallmentOverdue({ paidMonth, columnDateDue }) {
  const paidMonthIndex = paidMonth - 1; // zero-based index for month comparison
  const paidYear = DEFAULT_PERIOD_YEAR;

  const dateDue = parseDate(columnDateDue);
  const dateDueMonth = dateDue.getMonth();
  const dateDueYear = dateDue.getFullYear();

  let isOverDueYear = paidYear > dateDueYear;
  let isOverDueMonth = false;

  // because installment have grace period until the end of the month, we consider it overdue if paid month is more than 1 month after due month
  if (paidYear == dateDueYear && paidMonthIndex > dateDueMonth + 1) {
    isOverDueMonth = true;
  }
  // special case: if due date is in December and paid month is January next year, it's not overdue
  if (isOverDueYear && dateDueMonth == 11 && paidMonthIndex == 0) {
    isOverDueYear = false;
    isOverDueMonth = false;
  }

  return isOverDueYear || isOverDueMonth;
}

function _getInstallmentDebitur({ fileSource, noLoan }) {
  const sourceSS = SpreadsheetApp.openById(fileSource);

  // Get all sheet names except 'RESULT'
  const sourceMonths = sourceSS
    .getSheets()
    .map((sheet) => sheet.getName())
    .filter((name) => name !== 'RESULT');

  const sourceSheetResult = sourceSS.getSheetByName('RESULT');
  const sourceYear = sourceSheetResult.getRange(2, 5).getValue();

  const sourceSheet = sourceSS.getSheetByName(sourceMonths[0]);
  const sourceData = sourceSheet ? sourceSheet.getDataRange().getValues() : [];
  const sourceDataHeader = sourceData[0] || [];

  const sourceDataColumn = _getColumnIndex(sourceDataHeader);

  const results = [];

  sourceMonths.forEach((monthName, monthIndex) => {
    let rowId = null; // Step 1: Default to null if not found
    let rowLink = null;
    let row = [];

    const monthSheet = sourceSS.getSheetByName(monthName);
    if (!monthSheet) return;

    const monthSheetId = monthSheet.getSheetId();

    const rowEnd = monthSheet.getLastRow();
    if (rowEnd > 0) {
      const columnNoLoan = sourceDataColumn['NO LOAN'];
      if (columnNoLoan == null || columnNoLoan < 0) {
        throw new Error('NO LOAN column not found in source header');
      }

      const columnNoLoans = monthSheet.getRange(1, columnNoLoan + 1, rowEnd, 1);

      const columnMatch = columnNoLoans
        .createTextFinder(noLoan)
        .matchEntireCell(true)
        .findNext();

      if (columnMatch) {
        rowId = columnMatch.getRow(); // Step 2: Grab the exact row number (e.g., 452)
        rowLink = _getInstallmentUrl({
          fileId: fileSource,
          sheetId: monthSheetId,
          rowId,
        });

        row = monthSheet
          .getRange(rowId, 1, 1, monthSheet.getLastColumn())
          .getValues()[0];
      }
    }

    if (rowId === null) return;

    results.push({
      row: rowId, // Step 3: Package the row number into the data sent to HTML,
      rowLink,
      installment: String(monthIndex + 1).padStart(2, '0') + '/' + sourceYear,

      principalBefore: row[sourceDataColumn['SISA KREDIT']] || 0,

      principalPayment: null,
      principalRemaining: null,

      paymentInterest: row[sourceDataColumn['HITUNGAN BPR']] || 0,
    });
  });

  return results;
}

// 'D5027123', T1003503
function _getInstallmentUrl({ fileId, sheetId, rowId }) {
  const row = Number(rowId);
  if (!Number.isInteger(row) || row < 1) {
    throw new Error(`Invalid row number: ${rowId}`);
  }

  const url = `https://docs.google.com/spreadsheets/d/${fileId}/edit?gid=${sheetId}#gid=${sheetId}&range=${row}:${row}`;
  return url;
}
