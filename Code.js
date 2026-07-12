let FILE_ID_SOURCE = '1NyKmiPDO68ZeqFUS8d1xJZ1dbY0JKvP8bixbcYEC9cQ';
let FILE_ID_SOURCE_2025 = '19Fa9-RAMW2gEZz0KmVoM-Ls0qLDEyYK8L0USyezM0QI';
let FILE_ID_REKAPITULASI = '1JSvQXVhC6InSpULihdoxNGrIjsoZ5V7OplV5CptWc_c';

let DEFAULT_PERIOD_YEAR = 2026;
let DEFAULT_RATE_SUBSIDI = 0.0925;

const PROPERTY_KEYS = {
  FILE_ID_SOURCE: 'config.fileSourceId',
  FILE_ID_SOURCE_2025: 'config.fileSourceId2025',
  FILE_ID_REKAPITULASI: 'config.fileSourceIdRekapitulasi',
  DEFAULT_PERIOD_YEAR: 'config.defaultPeriodYear',
  DEFAULT_RATE_SUBSIDI: 'config.defaultRateSubsidi',
};

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

_getAppConfig();

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 Rekon Tools')
    .addItem('Verif Tagihan', 'dialogVerif')
    .addItem('Verif Terakhir', 'dialogVerifResult')
    .addItem('Lihat Riwayat Debitur', 'dialogDebtorHistory')
    .addItem('Lihat Rekapitulasi', 'navigateToRekapitulasi')
    .addItem('Pengaturan', 'dialogAppConfig')
    .addToUi();
}

// load ui
function dialogAppConfig() {
  const config = _getAppConfig();

  const html = HtmlService.createTemplateFromFile('ui/DialogAppConfig');
  html.props = {
    fileSourceId: config.fileSourceId,
    fileSourceId2025: config.fileSourceId2025,
    fileSourceIdRekapitulasi: config.fileSourceIdRekapitulasi,
    defaultPeriodYear: config.defaultPeriodYear,
    defaultRateSubsidi: config.defaultRateSubsidi,
  };

  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(500).setHeight(420),
    'Pengaturan Aplikasi',
  );
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

function dialogDebtorHistory() {
  _getAppConfig();

  const activeSS = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = activeSS.getActiveSheet();
  const activeRange = activeSheet.getActiveRange();

  if (!activeRange) return;

  const dataHeader = activeSheet
    .getRange(1, 1, 1, activeSheet.getLastColumn())
    .getValues()[0];

  const dataColumn = _getColumnIndex(dataHeader);

  const rowSelected = activeRange.getRow();
  const rowData = activeSheet
    .getRange(rowSelected, 1, 1, activeSheet.getLastColumn())
    .getValues()[0];

  const { debitur, debiturSchedule, debiturInstallment } =
    _simulateTagihanDebitur(rowData, dataColumn, activeSheet.getName());

  const dateReal = parseDate(debitur[dataColumn['MULAI']], 'dd/MM/yyyy', false);
  const dateRealYear = dateReal.getFullYear();

  const dateEnd = parseDate(
    debitur[dataColumn['JATUH TEMPO']],
    'dd/MM/yyyy',
    false,
  );
  const dateEndYear = dateEnd.getFullYear();

  let debiturScheduleRealization = [];
  if (dateRealYear < DEFAULT_PERIOD_YEAR) {
    // get realization 2025
    debiturScheduleRealization = [
      ...debiturScheduleRealization,
      ..._getInstallmentDebitur({
        fileSource: FILE_ID_SOURCE_2025,
        noLoan: debitur[dataColumn['NO LOAN']],
      }),
    ];
  }

  // get realization 2026
  if (dateEndYear >= DEFAULT_PERIOD_YEAR) {
    debiturScheduleRealization = [
      ...debiturScheduleRealization,
      ..._getInstallmentDebitur({
        fileSource: activeSS.getId(),
        noLoan: debitur[dataColumn['NO LOAN']],
      }),
    ];
  }

  const schedule = [
    ...debiturScheduleRealization,
    // ...debiturSchedule.schedule.filter(({ installment }) => {
    //   return (
    //     installment == debiturInstallment.installment - 1 ||
    //     installment == debiturInstallment.installment
    //   );
    // }),
  ];

  const html = HtmlService.createTemplateFromFile('ui/DialogDebtorHistory');
  html.props = {
    debitur: JSON.stringify({
      cabang: debitur[dataColumn['CABANG']],
      noLoan: debitur[dataColumn['NO LOAN']],
      nama: debitur[dataColumn['NAMA']],
      plafond: debitur[dataColumn['PLAFOND']],
      tenor: debitur[dataColumn['JANGKA WAKTU']],
      interestTotal: debiturSchedule.interestTotal,
      dateReal: Utilities.formatDate(
        new Date(debitur[dataColumn['MULAI']]),
        Session.getScriptTimeZone(),
        'dd, MMM yyyy',
      ),
      dateEnd: Utilities.formatDate(
        new Date(debitur[dataColumn['JATUH TEMPO']]),
        Session.getScriptTimeZone(),
        'dd, MMM yyyy',
      ),
    }),
    schedule: JSON.stringify(schedule),
    scheduleInstallment: JSON.stringify(debiturInstallment),
  };

  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(450).setHeight(350),
    `Riwayat Tagihan ${debitur[dataColumn['NAMA']]}`,
  );
}

// functions
function verifTagihan(month = 'JANUARI') {
  _getAppConfig();

  const monthUpper = month.toUpperCase();
  const INDEX_HEADER = 4;
  const INDEX_DATA_START = 7;

  const verifChecklist = { ...DEFAULT_RESULT };

  const props = PropertiesService.getScriptProperties();
  const sheetsVerified = new Set(
    JSON.parse(props.getProperty('sheetsVerified') || '[]'),
  );

  const sourceSS = SpreadsheetApp.openById(FILE_ID_SOURCE);
  const sourceSheet = sourceSS.getSheetByName(`TAGIHAN ${monthUpper} 2026`);

  const sourceData = sourceSheet.getDataRange().getValues();
  const sourceDataHeader = sourceData[INDEX_HEADER] || [];
  const sourceDataColumn = _remapColumnIndex(sourceDataHeader, monthUpper);

  const activeSS = SpreadsheetApp.getActiveSpreadsheet();
  const resultSheet = activeSS.getSheetByName('RESULT');

  let targetData = [
    // header
    [
      ...Object.keys(sourceDataColumn),
      'HITUNGAN DISKOP',
      'SELISIH',
      'STATUS',
      'KET',
    ],
  ];
  let targetSheet = activeSS.getSheetByName(month);

  if (!targetSheet) {
    targetSheet = activeSS.insertSheet(month);
  }

  for (let i = INDEX_DATA_START; i < sourceData.length - 1; i++) {
    const row = sourceData[i];
    const notes = [];

    if (row[sourceDataColumn['HITUNGAN BPR']] == 0) continue;

    const calcBPR = row[sourceDataColumn['HITUNGAN BPR']];

    // TODO: remove this, temporary calc. total bunga dibayar
    // const calcRatePaid = calcBPR / 0.0925;
    // // 1. calc. hitungan diskop
    // const calcDiskop = calcRatePaid * 0.0925;

    const calcRatePaid =
      Number(row[sourceDataColumn['TOTAL BUNGA DIBAYAR']]) || 0;
    const calcDiskop = (9.25 / 3) * calcRatePaid;

    // 2. check overDue
    const respInstallmentOverDue = _checkInstallmentOverdue({
      paidMonth: MONTH_MAPPED[monthUpper],
      columnDateDue: row[sourceDataColumn['JATUH TEMPO']],
    });

    if (!!respInstallmentOverDue) {
      verifChecklist.hasOverDue = true;
      notes.push(respInstallmentOverDue);
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

    targetData.push([
      row[sourceDataColumn['NO LOAN']], // 'NO LOAN'
      row[sourceDataColumn['TIPE LOAN']], // 'TIPE LOAN'
      row[sourceDataColumn['CABANG']], // 'CABANG'
      row[sourceDataColumn['NO PK']], // 'NO PK'
      row[sourceDataColumn['NAMA']], // 'NAMA'
      row[sourceDataColumn['ALAMAT']], // 'ALAMAT'
      row[sourceDataColumn['USAHA']], // 'USAHA'
      parseDate(row[sourceDataColumn['MULAI']]), // 'MULAI'
      parseDate(row[sourceDataColumn['JATUH TEMPO']]), // 'JATUH TEMPO'
      row[sourceDataColumn['JANGKA WAKTU']], // 'JANGKA WAKTU'
      parseNumber(row[sourceDataColumn['PLAFOND']]), // 'PLAFOND'
      parseNumber(row[sourceDataColumn['TOTAL SUBSIDI']]), // 'TOTAL SUBSIDI'
      parseNumber(row[sourceDataColumn['SISA KREDIT']]), // 'SISA KREDIT'
      parseNumber(row[sourceDataColumn['TUNGGAKAN POKOK']]), // 'TUNGGAKAN POKOK'
      parseNumber(row[sourceDataColumn['TUNGGAKAN BUNGA']]), // 'TUNGGAKAN BUNGA'
      String(row[sourceDataColumn['KOLEKTIBILITAS']] || '').toUpperCase(), // 'KOLEKTIBILITAS'

      // TODO: remove this, temporary calc. total bunga dibayar
      // row[sourceDataColumn['TOTAL BUNGA DIBAYAR']], // 'TOTAL BUNGA DIBAYAR'
      calcRatePaid, // 'TOTAL BUNGA DIBAYAR'

      parseNumber(row[sourceDataColumn['HITUNGAN BPR']]), // 'HITUNGAN BPR'
      calcDiskop, // 'HITUNGAN DISKOP'
      calcDiff, // 'SELISIH'
      notes.join(', '), // 'STATUS'
      '', // 'KET'
    ]);
  }

  targetSheet.clearContents();

  targetSheet
    .getRange(1, 1, targetData.length, targetData[0].length)
    .setValues(targetData);

  const timestamp = Utilities.formatDate(
    new Date(),
    'Asia/Jakarta',
    'dd/MM/yyyy HH:mm:ss',
  );
  resultSheet.getRange(1, 3).setValue(timestamp);
  resultSheet.getRange(2, 3).setValue(monthUpper);

  sheetsVerified.add(month);

  props.setProperty('sheetsVerified', JSON.stringify([...sheetsVerified]));
  props.setProperty(
    'result',
    JSON.stringify({
      ...verifChecklist,
      verifiedAt: timestamp,
      verifiedMonth: monthUpper,
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
  _getAppConfig();

  const url = FILE_ID_REKAPITULASI.includes('http')
    ? FILE_ID_REKAPITULASI
    : `https://docs.google.com/spreadsheets/d/${FILE_ID_REKAPITULASI}`;

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

function saveAppConfig(formData) {
  const props = PropertiesService.getScriptProperties();
  const appConfig = {
    fileSourceId: formData.fileSourceId || FILE_ID_SOURCE,
    fileSourceId2025: formData.fileSourceId2025 || FILE_ID_SOURCE_2025,
    fileSourceIdRekapitulasi:
      formData.fileSourceIdRekapitulasi || FILE_ID_REKAPITULASI,
    defaultPeriodYear: Number(
      formData.defaultPeriodYear || DEFAULT_PERIOD_YEAR,
    ),
    defaultRateSubsidi: Number(
      formData.defaultRateSubsidi || DEFAULT_RATE_SUBSIDI,
    ),
  };

  props.setProperty(PROPERTY_KEYS.FILE_ID_SOURCE, appConfig.fileSourceId);
  props.setProperty(
    PROPERTY_KEYS.FILE_ID_SOURCE_2025,
    appConfig.fileSourceId2025,
  );
  props.setProperty(
    PROPERTY_KEYS.FILE_ID_REKAPITULASI,
    appConfig.fileSourceIdRekapitulasi,
  );
  props.setProperty(
    PROPERTY_KEYS.DEFAULT_PERIOD_YEAR,
    String(appConfig.defaultPeriodYear),
  );
  props.setProperty(
    PROPERTY_KEYS.DEFAULT_RATE_SUBSIDI,
    String(appConfig.defaultRateSubsidi),
  );

  _getAppConfig();

  return appConfig;
}

// const props = PropertiesService.getScriptProperties();
// props.setProperty("sheetsVerified", JSON.stringify(['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November']));
