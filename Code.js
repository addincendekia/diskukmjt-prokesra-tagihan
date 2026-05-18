const FILE_ID_SOURCE = '165qo3-b5p-2UKDKtnPOukuUPRokPyV7yac6QwGk3FNs';

const DEFAULT_PERIOD_YEAR = 2026;

const DEFAULT_RESULT = {
  verifiedAt: null,
  verifiedMonth: null,
  totalDebitur: 0,
  totalSubsidi: 0,
  hasInvalid: false,
  hasOverDue: false,
  hasOverPlafond: false,
};

const MONTH_MAPPED = {
  JANUARI: 1,
  FEBRUARI: 2,
  MARET: 3,
  APRIL: 4,
  MEI: 5,
  JUNI: 6,
  JULI: 7,
  AGUSTUS: 8,
  SEPTEMBER: 9,
  OKTOBER: 10,
  NOVEMBER: 11,
  DESEMBER: 12,
};

// Mapping dari source header ke expected header
const HEADER_MAPPING = {
  'NO LOAN': 'NO LOAN',
  'Tipe Loan': 'TIPE LOAN',
  Cabang: 'CABANG',
  'No PK': 'NO PK',
  Nama: 'NAMA',
  Alamat: 'ALAMAT',
  Usaha: 'USAHA',
  'Tanggal Realisasi': 'MULAI',
  'Tanggal Jatuh Tempo': 'JATUH TEMPO',
  'Jangka Waktu': 'JANGKA WAKTU',
  Plafond: 'PLAFOND',
  'Total Subsidi': 'TOTAL SUBSIDI',
  'Sisa Kredit': 'SISA KREDIT',
  'Tunggakan Pokok': 'TUNGGAKAN POKOK',
  'Tunggakan Bunga': 'TUNGGAKAN BUNGA',
  Kolektibilitas: 'KOLEKTIBILITAS',
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 Rekon Tools')
    .addItem('Verif Tagihan', 'dialogVerif')
    .addItem('Verif Terakhir', 'dialogVerifResult')
    .addItem('Lihat Rekapitulasi', 'navigateToRekapitulasi')
    .addToUi();
}

function dialogVerif() {
  const props = PropertiesService.getScriptProperties();
  const months = JSON.stringify(
    Object.keys(MONTH_MAPPED).map((m) => m[0].toUpperCase() + m.slice(1)),
  );

  const html = HtmlService.createTemplateFromFile('DialogVerif');
  html.props = {
    months,
    months_verified: JSON.parse(props.getProperty('sheetsVerified') || '[]'),
  };

  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(350).setHeight(350),
    'Verif Tagihan',
  );
}

function dialogVerifResult() {
  const props = PropertiesService.getScriptProperties();

  let result = DEFAULT_RESULT;
  if (props.getProperty('result')) {
    result = JSON.parse(props.getProperty('result'));
  }

  const html = HtmlService.createTemplateFromFile('DialogVerifResult');
  html.props = {
    result: JSON.stringify({ ...result }),
  };

  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(350).setHeight(350),
    'Verif Tagihan - Result',
  );
}

function verifTagihan(month = 'JANUARI') {
  const INDEX_HEADER = 4;
  const INDEX_DATA_START = 7;

  const verifChecklist = { ...DEFAULT_RESULT };

  const props = PropertiesService.getScriptProperties();
  const sheetsVerified = new Set(
    JSON.parse(props.getProperty('sheetsVerified') || '[]'),
  );

  const activeSS = SpreadsheetApp.getActiveSpreadsheet();

  const sourceSS = SpreadsheetApp.openById(FILE_ID_SOURCE);
  const sourceSheet = sourceSS.getSheetByName(`TAGIHAN ${month} 2026`);

  let targetSheet = activeSS.getSheetByName(month);
  if (!targetSheet) {
    targetSheet = activeSS.insertSheet(month);
  }

  const resultSheet = activeSS.getSheetByName('RESULT');

  const sourceData = sourceSheet.getDataRange().getValues();
  const sourceDataHeader = sourceData[INDEX_HEADER] || [];
  const sourceDataColumn = remapDataColumn(sourceDataHeader, month);

  const PROCESSED_HEADER = [
    ...Object.values(HEADER_MAPPING),
    'TOTAL BUNGA DIBAYAR',
    'HITUNGAN BPR',
    'HITUNGAN DISKOP',
    'SELISIH',
    'STATUS',
    'KET',
  ];
  const INDEX_DATA_END = sourceData.length - 1; // Last row with data (exclude total/subsidi if exist)

  for (let i = 0; i < sourceData.length; i++) {
    // Extend all data rows to match header length
    while (sourceData[i].length < PROCESSED_HEADER.length) {
      sourceData[i].push('');
    }

    // Skip header rows
    if (i < INDEX_DATA_START) continue;
    if (i >= INDEX_DATA_END) continue;

    const row = sourceData[i];
    const notes = [];

    if (row[sourceDataColumn['HITUNGAN BPR']] == 0) continue;

    // TODO: remove this, temporary calc. total bunga dibayar
    const calcBPR = row[sourceDataColumn['HITUNGAN BPR']];
    const totalRatePaid = calcBPR / 0.0925;
    sourceData[i][sourceDataColumn['TOTAL BUNGA DIBAYAR']] = totalRatePaid;

    // 1. calc. hitungan diskop
    const calcDiskop = totalRatePaid * 0.0925;

    // 2. check overDue
    const paidMonth = MONTH_MAPPED[month.toUpperCase()];
    const paidYear = DEFAULT_PERIOD_YEAR;

    const dateDue = new Date(row[sourceDataColumn['JATUH TEMPO']]);
    const dateDueMonth = dateDue.getMonth();
    const dateDueYear = dateDue.getFullYear();

    const isOverDueYear = paidYear > dateDueYear;
    const isOverDueMonth =
      paidYear == dateDueYear && paidMonth - 1 > dateDueMonth;
    if (isOverDueYear || isOverDueMonth) {
      verifChecklist.hasOverDue = true;
      notes.push(`overdue`);
    }

    // 3. check differentiate, add status valid/invalid
    const calcDiff = calcBPR - calcDiskop;
    const calcStatus =
      calcDiff <= -1000 || calcDiff >= 1000 ? 'invalid' : 'valid';

    if (calcStatus === 'invalid') {
      verifChecklist.hasInvalid = true;
      notes.push('invalid');
    }

    // 4. count debitur & subsidi
    verifChecklist.totalDebitur = verifChecklist.totalDebitur + 1;
    verifChecklist.totalSubsidi = verifChecklist.totalSubsidi + calcBPR;

    sourceData[i][sourceDataColumn['HITUNGAN DISKOP']] = calcDiskop;
    sourceData[i][sourceDataColumn['SELISIH']] = calcDiff;
    sourceData[i][sourceDataColumn['STATUS']] = notes.join(', ');
  }

  const processedData = [
    // header
    PROCESSED_HEADER,
    // data
    ...sourceData.slice(INDEX_DATA_START, INDEX_DATA_END),
  ];

  targetSheet
    .getRange(1, 1, processedData.length, processedData[0].length)
    .setValues(processedData);

  const timestamp = Utilities.formatDate(
    new Date(),
    activeSS.getSpreadsheetTimeZone(),
    'dd/MM/yyyy HH:mm:ss',
  );
  resultSheet.getRange(1, 3).setValue(timestamp);
  resultSheet.getRange(2, 3).setValue(month);

  sheetsVerified.add(month);

  props.setProperty('sheetsVerified', JSON.stringify([...sheetsVerified]));
  props.setProperty(
    'result',
    JSON.stringify({
      ...verifChecklist,
      verifiedAt: timestamp,
      verifiedMonth: month,
    }),
  );

  dialogVerifResult();
}

function resetVerifProcessed() {
  PropertiesService.getScriptProperties().deleteProperty('sheetsVerified');

  const currentSS = SpreadsheetApp.getActiveSpreadsheet();
  currentSS.toast(`Progress back to 0`, 'Reseted Data', 2);
}

function resetVerifResult() {
  PropertiesService.getScriptProperties().deleteProperty('result');

  const currentSS = SpreadsheetApp.getActiveSpreadsheet();

  const sheetResult = currentSS.getSheetByName('RESULT');
  sheetResult.getRange(1, 3).clearContent();
  sheetResult.getRange(2, 3).clearContent();
  // sheetResult .getRange(5, 3, 4, 2).clearContent();

  currentSS.toast(`Result back to null`, 'Reseted Data', 2);
}

function navigateToResult() {
  const activeSS = SpreadsheetApp.getActiveSpreadsheet();
  activeSS.setActiveSheet(activeSS.getSheetByName('RESULT'));
}

function navigateToRekapitulasi() {
  const url =
    'https://docs.google.com/spreadsheets/d/1JSvQXVhC6InSpULihdoxNGrIjsoZ5V7OplV5CptWc_c';

  const html = HtmlService.createHtmlOutput(
    `
      <script>
        window.open("${url}", "_blank");
        google.script.host.close();
      </script>

      <p>Redirecting...</p>
    `,
  )
    .setWidth(250)
    .setHeight(150);

  SpreadsheetApp.getUi().showModalDialog(html, 'Opening Rekapitulasi');
}

// const props = PropertiesService.getScriptProperties();
// props.setProperty("sheetsVerified", JSON.stringify(['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November']));
