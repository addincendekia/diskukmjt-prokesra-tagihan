function parseDate(value, format = 'dd/MM/yyyy', reverse = true) {
  let valueFormatted = value;

  // If it's a Date instance, swap day and month
  if (value instanceof Date) {
    const year = value.getFullYear();
    let day = value.getDate();
    let month = value.getMonth(); // 0-indexed

    if (reverse) {
      const dayInit = day;
      const monthInit = month;

      // swapped day and month for correct parsing
      day = monthInit + 1;
      month = dayInit - 1;
    }

    valueFormatted = new Date(year, month, day).toLocaleDateString('en-GB');
  }

  // If it's a String, and non standart date. ex: 03-08-23
  if (typeof value === 'string' && value.includes('-') && value.length === 8) {
    const valueParsed = value.split('-');
    const day = valueParsed[0];
    const month = valueParsed[1];
    const year = `20${valueParsed[2]}`;

    valueFormatted = new Date(year, month, day).toLocaleDateString('en-GB');
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
