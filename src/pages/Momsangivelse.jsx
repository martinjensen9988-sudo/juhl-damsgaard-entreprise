import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadAccounts, loadPostedEntries, accountMap, computeVat } from '@/lib/accounting';
import { Receipt, Check, FileDown } from 'lucide-react';

function quarterOptions() {
  const opts = [];
  const y = new Date().getFullYear();
  for (let year = y; year >= y - 1; year--) {
    for (let q = 4; q >= 1; q--) opts.push(`${year}-Q${q}`);
  }
  return opts;
}
function monthOptions() {
  const opts = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    opts.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
  return opts;
}

export default function Momsangivelse() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [reports, setReports] = useState([]);
  const [period, setPeriod] = useState(quarterOptions()[0]);
  const [periodType, setPeriodType] = useState('Kvartal');

  const load = useCallback(async () => {
    const [e, a, r] = await Promise.all([
      loadPostedEntries(),
      loadAccounts(),
      base44.entities.VatReport.list('-period', 50).catch(() => []),
    ]);
    setEntries(e); setAccounts(a); setReports(r || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const aMap = accountMap(accounts);
  const calc = computeVat(entries, period, aMap);

  const dueFor = (p) => {
    const m = p.match(/^(\d{4})-Q([1-4])$/);
    if (m) { const y = +m[1]; const q = +m[2]; const month = q * 3; const due = new Date(y, month, 1); return due.toISOString().slice(0, 10); }
    const mm = p.match(/^(\d{4})-(\d{2})$/);
    if (mm) { const due = new Date(+mm[1], +mm[2], 1); return due.toISOString().slice(0, 10); }
    return '';
  };

  const [exporting, setExporting] = useState(false);
  const exportSkat = async () => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke('skatRapport', { type: 'vat', period });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `momsangivelse-${period}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Kunne ikke generere rapport'); }
    finally { setExporting(false); }
  };
  const saveReport = async () => {
    const existing = reports.find((r) => r.period === period);
    const payload = { period, period_type: periodType, sales_basis: calc.sales_basis, output_vat: calc.output_vat, purchase_basis: calc.purchase_basis, input_vat: calc.input_vat, payable_vat: calc.payable, due_date: dueFor(period), status: 'Udkast' };
    if (existing) await base44.entities.VatReport.update(existing.id, payload);
    else await base44.entities.VatReport.create(payload);
    load();
  };
  const setStatus = async (r, status) => { await base44.entities.VatReport.update(r.id, { status, submitted_date: status === 'Indberettet' ? new Date().toISOString().slice(0, 10) : null }); load(); };

  const options = periodType === 'Kvartal' ? quarterOptions() : monthOptions();

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="w-6 h-6" /> Momsangivelse</h1>
        <p className="text-sm text-muted-foreground">Moms beregnes på grundlag af bogførte posteringer efter gældende danske regler.</p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex gap-3 items-end">
          <div><Label>Periode type</Label><Select value={periodType} onValueChange={(v) => setPeriodType(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Kvartal">Kvartal</SelectItem><SelectItem value="Måned">Måned</SelectItem></SelectContent></Select></div>
          <div className="flex-1"><Label>Periode</Label><Select value={period} onValueChange={setPeriod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
          <Button variant="outline" onClick={exportSkat} disabled={exporting}><FileDown className="w-4 h-4" /> {exporting ? 'Genererer…' : 'SKAT-klar eksport'}</Button>
          <Button onClick={saveReport}>Gem som udkast</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Salgsgrundlag (ekscl. moms)</div><div className="text-xl font-bold">{calc.sales_basis.toLocaleString('da-DK')} DKK</div></div>
          <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Udgående moms (25%)</div><div className="text-xl font-bold text-blue-700">{calc.output_vat.toLocaleString('da-DK')} DKK</div></div>
          <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Købsgrundlag (ekscl. moms)</div><div className="text-xl font-bold">{calc.purchase_basis.toLocaleString('da-DK')} DKK</div></div>
          <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Indgående moms (25%)</div><div className="text-xl font-bold text-amber-700">{calc.input_vat.toLocaleString('da-DK')} DKK</div></div>
          <div className="col-span-2 rounded border bg-slate-50 p-3"><div className="text-sm text-muted-foreground">Moms at betale til SKAT</div><div className={`text-2xl font-bold ${calc.payable >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{calc.payable.toLocaleString('da-DK')} DKK {calc.payable < 0 && '(til godkendelse/refusion)'}</div></div>
        </div>
        <p className="text-xs text-muted-foreground">Betalingsfrist pr. periode: {dueFor(period)}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Gemte momsangivelser</h3>
        {reports.length === 0 && <p className="text-sm text-muted-foreground">Ingen gemte angivelser.</p>}
        {reports.map((r) => (
          <div key={r.id} className="rounded-lg border bg-card p-3 flex items-center justify-between gap-2">
            <div>
              <div className="font-medium">{r.period} ({r.period_type})</div>
              <div className="text-xs text-muted-foreground">Salg: {(r.sales_basis || 0).toLocaleString('da-DK')} • Køb: {(r.purchase_basis || 0).toLocaleString('da-DK')} • Moms: {(r.payable_vat || 0).toLocaleString('da-DK')} DKK</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${r.status === 'Betalt' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Indberettet' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span>
              {r.status === 'Udkast' && <Button size="sm" variant="outline" onClick={() => setStatus(r, 'Indberettet')}><Check className="w-3.5 h-3.5" /> Indberet</Button>}
              {r.status === 'Indberettet' && <Button size="sm" variant="outline" onClick={() => setStatus(r, 'Betalt')}><Check className="w-3.5 h-3.5" /> Marker betalt</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}