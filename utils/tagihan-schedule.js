function generateEffectiveSchedule({ principal, tenor, paymentInterval = 1 }) {
  const installments = tenor / paymentInterval;

  const principalInstallment = principal / installments;
  // hitung effective rate (identik Excel)
  const principalRemaining = (principal * (installments + 1)) / 2;

  // total bunga flat
  const interestTotal = ((principal * DEFAULT_RATE_SUBSIDI) / 12) * tenor;

  const rateEffective =
    (interestTotal * 12) / paymentInterval / principalRemaining;
  const rateMonthly = rateEffective / 12;

  const schedule = [];
  let principalRemain = principal;

  for (let i = 1; i <= installments; i++) {
    const principalBefore = principalRemain;
    const principalPayment = principalInstallment;

    // const paymentInterest = principalBefore * rateEffective * paymentInterval;
    const paymentInterest = principalBefore * rateMonthly * paymentInterval;
    // const paymentTotal = principalPayment + paymentInterest;

    if (i === installments) {
      principalRemain = 0;
    } else {
      principalRemain -= principalPayment;
    }

    schedule.push({
      installment: i,
      principalBefore: principalBefore,
      principalPayment: principalPayment,
      principalRemaining: Math.max(0, principalRemain),
      paymentInterest: paymentInterest,
      //   paymentTotal: paymentTotal
    });
  }

  return {
    interestTotal,
    interestRate: rateEffective,
    schedule,
  };
}

function generateFlatSchedule({ principal, tenor, paymentInterval = 1 }) {
  const installments = tenor / paymentInterval;

  // validasi
  if (tenor % paymentInterval !== 0) {
    throw new Error('Tenor harus habis dibagi paymentInterval');
  }

  const principalInstallment = principal / installments;

  // bunga flat per periode (tetap)
  const paymentInterest = Math.round(
    ((principal * DEFAULT_RATE_SUBSIDI) / 12) * paymentInterval,
  );

  const interestTotal = paymentInterest * installments;

  let principalRemain = principal;

  const schedule = [];

  for (let i = 1; i <= installments; i++) {
    const principalBefore = principalRemain;

    const principalPayment = principalInstallment;

    const paymentTotal = principalPayment + paymentInterest;

    if (i === installments) {
      principalRemain = 0;
    } else {
      principalRemain -= principalPayment;
    }

    schedule.push({
      installment: i,
      principalBefore: principalBefore,
      principalPayment: principalPayment,
      principalRemaining: Math.max(0, principalRemain),
      paymentInterest: paymentInterest,
      paymentTotal: paymentTotal,
    });
  }

  return {
    interestTotal,
    interestRate: DEFAULT_RATE_SUBSIDI,
    schedule,
  };
}

function findSchedule({
  schedule,
  principalRemain,
  matchOption = 'currentschedule',
  tolerance = 0.15,
}) {
  const DEFAULT_TOLERANCE = 0.15; // toleransi perbedaan angka (misal karena pembulatan)

  let note = '';

  let diffToleranceCount = 0;
  let diffLowestIndex = -1;
  let diffLowest = Infinity;

  for (let i = 0; i < schedule.length; i++) {
    const matchedIndex = matchOption === 'nextschedule' ? i + 1 : i;

    const { principalBefore } = schedule[i];
    const diff = Math.abs(principalBefore - principalRemain);

    if (diff <= DEFAULT_TOLERANCE) {
      if (matchedIndex >= schedule.length) {
        return { index: -1 };
      }

      return { index: matchedIndex, note: '', ...schedule[matchedIndex] };
    }

    if (diff <= tolerance) {
      diffToleranceCount++;

      if (diff < diffLowest) {
        diffLowest = diff;
        diffLowestIndex = matchedIndex;
      }
    }

    const beforeStr = principalBefore.toFixed(2).toString();
    const remainStr = principalRemain.toFixed(2).toString();

    const isMatchLength = beforeStr.length === remainStr.length;
    const isMatchPrefix = beforeStr.slice(0, 2) == remainStr.slice(0, 2);

    if (isMatchLength && isMatchPrefix) {
      if (matchedIndex >= schedule.length) {
        return { index: -1 };
      }

      note = `Found ${formatNumber(principalBefore.toFixed(2))} nearest value to ${formatNumber(principalRemain)}`;
      return { index: matchedIndex, note, ...schedule[matchedIndex] };
    }
  }

  if (diffLowestIndex >= 0) {
    note = `Found ${diffToleranceCount} matches within ${formatNumber(tolerance)}, smallest diff ${formatNumber(diffLowest)}`;
    return { index: diffLowestIndex, note, ...schedule[diffLowestIndex] };
  }

  return { index: -1 };
}
