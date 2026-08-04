import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function inPeriod(entry, period) {
  const d = entry.date;
  if (!d) return false;
  if (/^\d{4}-Q[1-4]$/.test(period)) {
    const m = new Date(d).getMonth();
    return period === `${d.slice(0, 4)}-Q${Math.floor(m / 3) + 1}`;
  }
  if (/^\d{4}-\d{2}$/.test(period)) return d.slice(0, 7) === period;
  if (/^\d{4}$/.test(period)) return d.slice(0, 4) === period;
  return false;
}

function lineSigned(line, aMap) {
  const acc = aMap[line.account_number];
  if (!acc) return 0;
  const debit = Number(line.debit) || 0;
  const credit = Number(line.credit) || 0;
  if (acc.type === 'Indtægt' || acc.type === 'Finansiel indtægt') return credit - debit;
  if (acc.type === 'Omkostning' || acc.type === 'Finansiel omkostning') return debit - credit;
  return 0;
}

function computeVat(entries, period, aMap) {
  let sales_basis = 0, output_vat = 0, purchase_basis = 0, input_vat = 0;
  entries.filter((e) => e.status === 'Bogført').forEach((e) => {
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
  return { sales_basis, output_vat, purchase_basis, input_vat, payable_vat: output_vat - input_vat };
}

function computeResultat(entries, period, aMap) {
  const byAcc = {};
  entries.filter((e) => e.status === 'Bogført').forEach((e) => {
    if (!inPeriod(e, period)) return;
    (e.lines || []).forEach((line) => {
      const acc = aMap[line.account_number];
      if (!acc) return;
      byAcc[line.account_number] = (byAcc[line.account_number] || 0) + lineSigned(line, aMap);
    });
  });
  const rows = Object.entries(byAcc)
    .map(([num, amount]) => ({ account_number: num, name: aMap[num]?.name || num, type: aMap[num]?.type, amount }))
    .filter((r) => Math.abs(r.amount) > 0.01)
    .sort((a, b) => a.account_number.localeCompare(b.account_number));
  const driftsindtaegt = rows.filter((r) => r.type === 'Indtægt').reduce((s, r) => s + r.amount, 0);
  const driftsomkostning = rows.filter((r) => r.type === 'Omkostning').reduce((s, r) => s + r.amount, 0);
  const finansielIndtaegt = rows.filter((r) => r.type === 'Finansiel indtægt').reduce((s, r) => s + r.amount, 0);
  const finansielOmkostning = rows.filter((r) => r.type === 'Finansiel omkostning').reduce((s, r) => s + r.amount, 0);
  return {
    rows,
    driftsindtaegt,
    driftsomkostning,
    driftsresultat: driftsindtaegt - driftsomkostning,
    finansielIndtaegt,
    finansielOmkostning,
    aaretsResultat: driftsindtaegt - driftsomkostning + finansielIndtaegt - finansielOmkostning,
  };
}

function computeBalance(entries, upToDate, aMap) {
  const byAcc = {};
  entries.filter((e) => e.status === 'Bogført').forEach((e) => {
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
  const rows = Object.entries(byAcc)
    .map(([num, amount]) => ({ account_number: num, name: aMap[num]?.name || num, type: aMap[num]?.type, amount }))
    .filter((r) => Math.abs(r.amount) > 0.01)
    .sort((a, b) => a.account_number.localeCompare(b.account_number));
  const sumAktiver = rows.filter((r) => r.type === 'Aktiv').reduce((s, r) => s + r.amount, 0);
  const sumPassiver = rows.filter((r) => r.type === 'Passiv').reduce((s, r) => s + r.amount, 0);
  return { rows, sumAktiver, sumPassiver, balance: sumAktiver - sumPassiver };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Kun administratorer kan generere SKAT-rapport' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const type = body.type || 'annual';
    const period = body.period || String(new Date().getFullYear());

    const [accounts, entries, companyList] = await Promise.all([
      base44.asServiceRole.entities.Account.list('account_number', 500),
      base44.asServiceRole.entities.JournalEntry.list('-date', 5000),
      base44.asServiceRole.entities.CompanySettings.list('-created_date', 1),
    ]);
    const aMap = {};
    (accounts || []).forEach((a) => (aMap[a.account_number] = a));
    const company = (companyList || [])[0] || {};
    const generatedAt = new Date().toISOString();

    if (type === 'vat') {
      const vat = computeVat(entries || [], period, aMap);
      const posted = (entries || []).filter((e) => e.status === 'Bogført' && inPeriod(e, period)).length;
      return Response.json({
        rapport_type: 'momsangivelse',
        periode: period,
        genereret: generatedAt,
        virksomhed: {
          navn: company.company_name,
          cvr: company.cvr,
          moms_rate: company.vat_rate ?? 25,
        },
        salgsgrundlag_ekscl_moms: vat.sales_basis,
        udgaaende_moms: vat.output_vat,
        koebsgrundlag_ekscl_moms: vat.purchase_basis,
        indgaaende_moms: vat.input_vat,
        moms_at_betale: vat.payable_vat,
        bogfoerte_posteringer: posted,
        bemærkning: 'Beregnet efter dobbelt bogholderi med 25% dansk moms. Gennemgå med revisor/bogholder før indberetning til SKAT.',
      });
    }

    // annual report
    const resultat = computeResultat(entries || [], period, aMap);
    const balance = computeBalance(entries || [], `${period}-12-31`, aMap);
    return Response.json({
      rapport_type: 'aarsregnskab',
      regnskabsaar: period,
      genereret: generatedAt,
      virksomhed: {
        navn: company.company_name,
        cvr: company.cvr,
        adresse: [company.address, company.postal_code, company.city].filter(Boolean).join(', '),
      },
      resultatopgoerelse: {
        driftsindtaegter: resultat.driftsindtaegt,
        driftsomkostninger: resultat.driftsomkostning,
        driftsresultat: resultat.driftsresultat,
        finansiele_indtaegter: resultat.finansielIndtaegt,
        finansiele_omkostninger: resultat.finansielOmkostning,
        aarets_resultat: resultat.aaretsResultat,
        linjer: resultat.rows,
      },
      balance: {
        sum_aktiver: balance.sumAktiver,
        sum_passiver: balance.sumPassiver,
        balance_check: balance.balance,
        aktiver: balance.rows.filter((r) => r.type === 'Aktiv'),
        passiver: balance.rows.filter((r) => r.type === 'Passiv'),
      },
      bemærkning: 'Årsregnskab baseret på bogførte posteringer. Overholder dobbelt bogholderi-princippet. Gennemgå med revisor før indsendelse til Erhvervsstyrelsen/SKAT.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}