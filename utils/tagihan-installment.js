function getInstallmentDebitur({ fileSource, noLoan, plafond }) {
  const sourceSS = SpreadsheetApp.openById(fileSource);

  // Get all sheet names except 'RESULT'
  const months = sourceSS
    .getSheets()
    .map((sheet) => sheet.getName())
    .filter((name) => name !== 'RESULT');

  const results = [];
  let remainingBalance = plafond;

  const MONTH_DEBITUR_COL = 1;
  const MONTH_INSTALLMENT_COL = 2;

  months.forEach((monthName) => {
    const sheet = sourceSS.getSheetByName(monthName);
    if (!sheet) return;

    const lastRow = sheet.getLastRow();
    let installment = 0;
    let targetRow = null; // Step 1: Default to null if not found

    if (lastRow > 0) {
      const searchRange = sheet.getRange(1, MONTH_DEBITUR_COL, lastRow, 1);
      const cell = searchRange
        .createTextFinder(noLoan)
        .matchEntireCell(true)
        .findNext();

      if (cell) {
        targetRow = cell.getRow(); // Step 2: Grab the exact row number (e.g., 452)
        installment =
          sheet.getRange(targetRow, MONTH_INSTALLMENT_COL).getValue() || 0;
      }
    }

    remainingBalance -= installment;

    results.push({
      month: monthName.toUpperCase(),
      installment: installment,
      rest: remainingBalance,
      sheetName: monthName,
      row: targetRow, // Step 3: Package the row number into the data sent to HTML
    });
  });

  return results;
}

// // Step 4: Enhanced navigation function to jump to the exact row
// function jumpToSheetAndRow(sheetName, rowNumber) {
//   const ss = SpreadsheetApp.getActiveSpreadsheet();
//   const sheet = ss.getSheetByName(sheetName);

//   if (sheet && rowNumber) {
//     // 1. Switch to the correct monthly sheet
//     ss.setActiveSheet(sheet);

//     // 2. Target the specific row (Column 1 / Column A)
//     const targetCell = sheet.getRange(rowNumber, 1);

//     // 3. Jump the viewport/cursor to that exact cell
//     sheet.setActiveRange(targetCell);
//   }
// }
