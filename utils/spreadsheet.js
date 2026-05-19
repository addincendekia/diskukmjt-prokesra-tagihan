/**
 * Build mapped column indices for data processing
 * @param {Object} sourceDataHeader - Map of column names to indices
 * @param {string} month - Month for Tagihan Bulan lookup
 * @returns {Object} mappedColumn with all column indices
 */
function remapDataColumn(sourceDataHeader, month) {
  const columnTotalBungaDibayar = `Tagihan Bulan ${month.slice(0, 1).toUpperCase() + month.slice(1).toLowerCase()}`;

  // Build source column indices
  const column = {};
  sourceDataHeader.forEach((col, idx) => {
    column[col] = idx;
  });

  // Map to expected columns using HEADER_MAPPING
  const mappedColumn = {
    'NO LOAN': column['No Loan'],
    'TIPE LOAN': column['Tipe Loan'],
    CABANG: column['Cabang'],
    'NO PK': column['No PK'],
    NAMA: column['Nama'],
    ALAMAT: column['Alamat'],
    USAHA: column['Usaha'],
    MULAI: column['Tanggal Realisasi'],
    'JATUH TEMPO': column['Tanggal Jatuh Tempo'],
    'JANGKA WAKTU': column['Jangka Waktu'],
    PLAFOND: column['Plafond'],
    'TOTAL SUBSIDI': column['Total Subsidi'],
    'SISA KREDIT': column['Sisa Kredit'],
    'TUNGGAKAN POKOK': column['Tunggakan Pokok'],
    'TUNGGAKAN BUNGA': column['Tunggakan Bunga'],
    KOLEKTIBILITAS: column['Kolektibilitas'],
    'TOTAL BUNGA DIBAYAR': column[columnTotalBungaDibayar],
    'HITUNGAN BPR': column[''],
    // 'HITUNGAN DISKOP': -1, // Will be calculated
    // SELISIH: -1, // Will be calculated
    // STATUS: -1, // Will be calculated
    // KET: -1, // Will be calculated
  };

  return mappedColumn;
}
