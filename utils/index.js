function parseDate(value, format = 'dd/MM/yyyy') {
  let valueFormatted = value;

  // If it's a Date instance, swap day and month
  if (value instanceof Date) {
    const day = value.getDate();
    const month = value.getMonth(); // 0-indexed
    const year = value.getFullYear();

    // swapped day and month for correct parsing
    valueFormatted = new Date(year, day - 1, month + 1).toLocaleDateString(
      'en-GB',
    );
  }

  return Utilities.parseDate(
    valueFormatted,
    Session.getScriptTimeZone(),
    format,
  );
}

function parseNumber(value) {
  if (typeof value === 'string') {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  return value || 0;
}
