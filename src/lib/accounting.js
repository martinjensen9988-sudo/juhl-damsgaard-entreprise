import { base44 } from '@/api/base44Client';

export const STANDARD_KONTOPLAN = [
  ['1000', 'Kasse', 'Aktiv', 'none', 'none'],
  ['1010', 'Bank', 'Aktiv', 'none', 'none'],
  ['1080', 'Debitorer', 'Aktiv', 'none', 'none'],
  ['1500', 'Varelager', 'Aktiv', 'none', 'none'],
  ['1590', 'Maskiner og inventar', 'Aktiv', 'none', 'none'],
  ['1600', 'Køretøjer', 'Aktiv', 'none', 'none'],
  ['1610', 'Værktøj', 'Aktiv', 'none', 'none'],
  ['1700', 'Forudbetalte omkostninger', 'Aktiv', 'none', 'none'],
  ['1900', 'Diverse tilgodehavende', 'Aktiv', 'none', 'none'],
  ['2000', 'Kreditorer', 'Passiv', 'none', 'none'],
  ['2100', 'Skyldig moms', 'Passiv', 'none', 'none'],
  ['2150', 'Skyldig A-skat og AM-bidrag', 'Passiv', 'none', 'none'],
  ['2200', 'Skyldig lønninger', 'Passiv', 'none', 'none'],
  ['2300', 'Feriepenge', 'Passiv', 'none', 'none'],
  ['2500', 'Långivere', 'Passiv', 'none', 'none'],
  ['2900', 'Årets resultat', 'Passiv', 'none', 'none'],
  ['3000', 'Varesalg', 'Indtægt', 'salg25', 'none'],
  ['3100', 'Salg af ydelser', 'Indtægt', 'salg25', 'none'],
  ['3200', 'Moms af salg (udgående)', 'Passiv', 'none', 'output'],
  ['3400', 'Lagerforbrug', 'Omkostning', 'none', 'none'],
  ['4000', 'Varekøb', 'Omkostning', 'kob25', 'none'],
  ['4100', 'Forbrug materialer', 'Omkostning', 'kob25', 'none'],
  ['4200', 'Moms af køb (indgående)', 'Aktiv', 'none', 'input'],
  ['5000', 'Lønninger', 'Omkostning', 'none', 'none'],
  ['5100', 'AM-bidrag', 'Omkostning', 'none', 'none'],
  ['5200', 'Feriepenge', 'Omkostning', 'none', 'none'],
  ['5300', 'A-skat', 'Omkostning', 'none', 'none'],
  ['6000', 'Husleje', 'Omkostning', 'kob25', 'none'],
  ['6100', 'El, vand, varme', 'Omkostning', 'kob25', 'none'],
  ['6200', 'Forsikring', 'Omkostning', 'kob25', 'none'],
  ['6400', 'Repræsentation', 'Omkostning', 'none', 'none'],
  ['6500', 'Kontingenter', 'Omkostning', 'none', 'none'],
  ['7000', 'Markedsføring', 'Omkostning', 'kob25', 'none'],
  ['7100', 'Telefon og internet', 'Omkostning', 'kob25', 'none'],
  ['7200', 'Transport og kørsel', 'Omkostning', 'kob25', 'none'],
  ['7300', 'Værktøj', 'Omkostning', 'kob25', 'none'],
  ['7400', 'Reparation og vedligehold', 'Omkostning', 'kob25', 'none'],
  ['7500', 'Brændstof', 'Omkostning', 'kob25', 'none'],
  ['7600', 'Øvrige driftsomkostninger', 'Omkostning', 'none', 'none'],
  ['8000', 'Renteindtægter', 'Finansiel indtægt', 'none', 'none'],
  ['8900', 'Andre finansielle omkostninger', 'Finansiel omkostning', 'none', 'none'],
];

export function periodOf(date) { return date ? date.slice(0, 7) : ''; }
export function quarterOf(date) { if (!date) return ''; const m = new Date(date).getMonth(); return `${date.slice(0, 4)}-Q${Math.floor(m / 3) + 1}`; }

export function inPeriod(entry, period) {
  const d = entry.date;
  if (!d) return false;
  if (/^\d{4}-Q[1-4]$/.test(period)) { const m = new Date(d).getMonth(); return period === `${d.slice(0, 4)}-Q${Math.floor(m / 3) + 1}`; }
  if (/^\d{4}-\d{2}$/.test(period)) return d.slice(0, 7) === period;
  if (/^\d{4}$/.test(period)) return d.slice(0, 4) === period;
  return false;
}

export async function loadAccounts() { return await base44.entities.Account.list('account_number', 500).catch(() => []); }
export async function loadPostedEntries() { return await base44.entities.JournalEntry.list('-date', 5000).catch(() => []); }
export function accountMap(accounts) { const m = {}; (accounts || []).forEach((a) => (m[a.account_number] = a)); return m; }

export function lineSigned(line, aMap) {
  const acc = aMap[line.account_number];
  if (!acc) return 0;
  const debit = Number(line.debit) || 0;
  const credit = Number(line.credit) || 0;
  if (acc.type === 'Indtægt' || acc.type === 'Finansiel indtægt') return credit - debit;
  if (acc.type === 'Omkostning' || acc.type === 'Finansiel omkostning') return debit - credit;
  return 0;
}

export function computeVat(entries, period, aMap) {
  let sales_basis = 0, output_vat = 0, purchase_basis = 0, input_vat = 0;
  (entries || []).filter((e) => e.status === 'Bogført').forEach((e) => {
    if (!inPeriod(e, period)) return;
    (e.lines || []).forEach((line) => {
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      if (line.vat_code === 'salg25') sales_basis += credit || debit;
      if (line.vat_code === 'kob25') purchase_basis += debit || credit;
      const acc = aMap[line.account_number];
      if (acc && acc.vat_type === 'output') output_vat += credit - debit;
      if (acc && acc.vat_type === 'input') input_vat += debit - credit;
    });
  });
  return { sales_basis, output_vat, purchase_basis, input_vat, payable: output_vat - input_vat };
}

export function computeResultat(entries, period, aMap) {
  const byAcc = {};
  (entries || []).filter((e) => e.status === 'Bogført').forEach((e) => {
    if (!inPeriod(e, period)) return;
    (e.lines || []).forEach((line) => {
      const acc = aMap[line.account_number];
      if (!acc) return;
      const bal = lineSigned(line, aMap);
      byAcc[line.account_number] = (byAcc[line.account_number] || 0) + bal;
    });
  });
  const rows = Object.entries(byAcc).map(([num, amount]) => ({ account_number: num, name: aMap[num]?.name || num, type: aMap[num]?.type, amount }))
    .filter((r) => Math.abs(r.amount) > 0.01)
    .sort((a, b) => a.account_number.localeCompare(b.account_number));
  const drif = rows.filter((r) => r.type === 'Indtægt' || r.type === 'Omkostning');
  const fin = rows.filter((r) => r.type === 'Finansiel indtægt' || r.type === 'Finansiel omkostning');
  const driftsindtaegt = drif.filter((r) => r.type === 'Indtægt').reduce((s, r) => s + r.amount, 0);
  const driftsomkostning = drif.filter((r) => r.type === 'Omkostning').reduce((s, r) => s + r.amount, 0);
  const driftsresultat = driftsindtaegt - driftsomkostning;
  const finansielIndtaegt = fin.filter((r) => r.type === 'Finansiel indtægt').reduce((s, r) => s + r.amount, 0);
  const finansielOmkostning = fin.filter((r) => r.type === 'Finansiel omkostning').reduce((s, r) => s + r.amount, 0);
  const aaretsResultat = driftsresultat + finansielIndtaegt - finansielOmkostning;
  return { rows, drif, fin, driftsindtaegt, driftsomkostning, driftsresultat, finansielIndtaegt, finansielOmkostning, aaretsResultat };
}

export function computeMonthlyResultat(entries, year, aMap) {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const period = `${year}-${String(m).padStart(2, '0')}`;
    const byType = { Indtægt: 0, Omkostning: 0 };
    let variable = 0;
    (entries || []).filter((e) => e.status === 'Bogført').forEach((e) => {
      if (e.date && e.date.slice(0, 7) !== period) return;
      (e.lines || []).forEach((line) => {
        const acc = aMap[line.account_number];
        if (!acc) return;
        const bal = lineSigned(line, aMap);
        if (acc.type === 'Indtægt') byType.Indtægt += bal;
        if (acc.type === 'Omkostning') byType.Omkostning += bal;
        if (acc.type === 'Omkostning' && (line.vat_code === 'kob25' || /Vare|Forbrug|Lager|Brændstof|Material/i.test(acc.name || ''))) variable += bal;
      });
    });
    months.push({ period, maaned: m, indtaegt: byType.Indtægt, omkostning: byType.Omkostning, dækningsbidrag: byType.Indtægt - byType.Omkostning, variable });
  }
  let cum = 0;
  months.forEach((mm) => { cum += mm.dækningsbidrag; mm.cumulative = cum; });
  return months;
}

export function computeBalance(entries, upToDate, aMap) {
  const byAcc = {};
  (entries || []).filter((e) => e.status === 'Bogført').forEach((e) => {
    if (upToDate && e.date > upToDate) return;
    (e.lines || []).forEach((line) => {
      const acc = aMap[line.account_number];
      if (!acc) return;
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      const bal = acc.type === 'Aktiv' ? debit - credit : acc.type === 'Passiv' ? credit - debit : 0;
      byAcc[line.account_number] = (byAcc[line.account_number] || 0) + bal;
    });
  });
  const rows = Object.entries(byAcc).map(([num, amount]) => ({ account_number: num, name: aMap[num]?.name || num, type: aMap[num]?.type, amount }))
    .filter((r) => Math.abs(r.amount) > 0.01)
    .sort((a, b) => a.account_number.localeCompare(b.account_number));
  const aktiver = rows.filter((r) => r.type === 'Aktiv');
  const passiver = rows.filter((r) => r.type === 'Passiv');
  const sumAktiver = aktiver.reduce((s, r) => s + r.amount, 0);
  const sumPassiver = passiver.reduce((s, r) => s + r.amount, 0);
  return { rows, aktiver, passiver, sumAktiver, sumPassiver, balance: sumAktiver - sumPassiver };
}