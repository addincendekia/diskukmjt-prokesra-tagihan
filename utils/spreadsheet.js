/**
 * Build mapped column indices for data processing
 * @param {Object} sourceDataHeader - Map of column names to indices
 * @param {string} month - Month for Tagihan Bulan lookup
 * @returns {Object} mappedColumn with all column indices
 */
function remapDataColumn(sourceDataHeader, month) {
  // Build source column indices
  const column = {};
  sourceDataHeader.forEach((col, idx) => {
    column[col] = idx;
  });

  const columnTotalBungaDibayar = `Tagihan Bulan ${month.slice(0, 1).toUpperCase() + month.slice(1).toLowerCase()}`;

  // Map to expected columns using HEADER_MAPPING
  const mappedColumn = {
    "NO LOAN": column["NO LOAN"],
    MULAI: column["Tanggal Realisasi"],
    "JATUH TEMPO": column["Tanggal Jatuh Tempo"],
    "TOTAL BUNGA DIBAYAR": column[columnTotalBungaDibayar],
    "HITUNGAN BPR": column[""],
    "HITUNGAN DISKOP": -1, // Will be calculated
    SELISIH: -1, // Will be calculated
    STATUS: -1, // Will be calculated
    KET: -1, // Will be calculated
  };

  // Add new columns to header if not exist
  if (sourceDataHeader.indexOf("HITUNGAN DISKOP") === -1) {
    sourceDataHeader.push("HITUNGAN DISKOP");
  }
  if (sourceDataHeader.indexOf("SELISIH") === -1) {
    sourceDataHeader.push("SELISIH");
  }
  if (sourceDataHeader.indexOf("STATUS") === -1) {
    sourceDataHeader.push("STATUS");
  }
  if (sourceDataHeader.indexOf("KET") === -1) {
    sourceDataHeader.push("KET");
  }

  // Update mappedColumn with calculated column indices
  mappedColumn["HITUNGAN DISKOP"] = sourceDataHeader.indexOf("HITUNGAN DISKOP");
  mappedColumn["SELISIH"] = sourceDataHeader.indexOf("SELISIH");
  mappedColumn["STATUS"] = sourceDataHeader.indexOf("STATUS");
  mappedColumn["KET"] = sourceDataHeader.indexOf("KET");

  return mappedColumn;
}
