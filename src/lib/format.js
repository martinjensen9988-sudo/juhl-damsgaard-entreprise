export function formatDKK(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);
}

export function calcLineTotal(item) {
  return (Number(item?.quantity) || 0) * (Number(item?.unit_price) || 0);
}

export function calcSubtotal(items = []) {
  return (items || []).reduce((sum, item) => sum + calcLineTotal(item), 0);
}

export function calcVAT(subtotal, rate = 0.25) {
  return subtotal * rate;
}

export function calcTotal(items = []) {
  const subtotal = calcSubtotal(items);
  return subtotal + calcVAT(subtotal);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    // Date-only strings (YYYY-MM-DD) are parsed as UTC by default,
    // which shifts the displayed date back a day in non-UTC timezones.
    // Append T00:00:00 to parse as local time instead.
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    const d = isDateOnly ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
    return d.toLocaleDateString('da-DK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const VAT_RATE = 0.25;

export { VAT_RATE };