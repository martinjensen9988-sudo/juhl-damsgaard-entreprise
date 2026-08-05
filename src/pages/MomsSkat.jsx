import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDKK } from '@/lib/format';
import { Download, Percent, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const MONTHS = ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'];
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export default function MomsSkat() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [vatReports, setVatReports] = useState([]);
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth());
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      try {
        const [inv, sup, vat] = await Promise.all([
          base44.entities.Invoice.list('-created_date', 300).catch(() => []),
          base44.entities.SupplierInvoice.list('-created_date', 300).catch(() => []),
          base44.entities.VatReport.list('-created_date', 50).catch(() => []),
        ]);
        setInvoices(inv); setSupplierInvoices(sup); setVatReports(vat);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const periodKey = `${periodYear}-${String(periodMonth + 1).padStart(2, '0')}`;

  const data = useMemo(() => {
    const inMonth = (dateStr) => {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && monthKey(d) === periodKey;
    };
    const sales = (invoices || []).filter((i) => inMonth(i.date) && (i.status === 'Betalt' || i.status === 'Sendt'));
    const sales_basis = sales.reduce((s, inv) => s + (inv.line_items || []).reduce((a, li) => a + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0), 0), 0);
    const output_vat = Math.round(sales_basis * 0.25);

    const purchases = (supplierInvoices || []).filter((i) => inMonth(i.date));
    const purchase_basis = purchases.reduce((s, inv) => s + (Number(inv.amount) || 0), 0);
    const input_vat = purchases.reduce((s, inv) => s + (Number(inv.vat_amount) || 0), 0);

    const payable = output_vat - input_vat;

    const now = new Date();
    const buckets = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = monthKey(d);
      buckets[k] = { month: MONTHS[d.getMonth()].slice(0, 3), udgaaende: 0, indgaaende: 0 };
    }
    (invoices || []).forEach((inv) => {
      if (inv.status !== 'Betalt' && inv.status !== 'Sendt') return;
      const k = monthKey(new Date(inv.date));
      if (buckets[k]) {
        const basis = (inv.line_items || []).reduce((a, li) => a + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0), 0);
        buckets[k].udgaaende += Math.round(basis * 0.25);
      }
    });
    (supplierInvoices || []).forEach((inv) => {
      const k = monthKey(new Date(inv.date));
      if (buckets[k]) buckets[k].indgaaende += Number(inv.vat_amount) || 0;
    });

    return { sales_basis, output_vat, purchase_basis, input_vat, payable, history: Object.values(buckets), salesCount: sales.length, purchaseCount: purchases.length };
  }, [invoices, supplierInvoices, periodKey]);

  async function submitVat() {
    try {
      const due = new Date(periodYear, periodMonth + 1, 20).toISOString().slice(0, 10);
      await base44.entities.VatReport.create({
        period: periodKey,
        period_type: 'Måned',
        sales_basis: data.sales_basis,
        output_vat: data.output_vat,
        purchase_basis: data.purchase_basis,
        input_vat: data.input_vat,
        payable_vat: data.payable,
        due_date: due,
        status: 'Indberettet',
        submitted_date: new Date().toISOString().slice(0, 10),
      });
      setVatReports(await base44.entities.VatReport.list('-created_date', 50));
      alert('Momsangivelse indberettet for ' + periodKey);
    } catch (err) { alert(err.message); }
  }

  function exportCsv() {
    const rows = [
      ['Periode', 'Salgsgrundlag', 'Udgående moms', 'Købsgrundlag', 'Indgående moms', 'Moms at betale'],
      [periodKey, Math.round(data.sales_basis), data.output_vat, Math.round(data.purchase_basis), Math.round(data.input_vat), data.payable],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `moms-${periodKey}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;

  const alreadyReported = vatReports.some((r) => r.period === periodKey && r.status === 'Indberettet');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Moms og Skat</h1>
          <p className="text-slate-500 mt-1">Opsummering af indgående og udgående moms — klar til skat</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">Måned</Label>
            <Select value={String(periodMonth)} onValueChange={(v) => setPeriodMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">År</Label>
            <input type="number" value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} className="h-9 w-24 rounded-md border border-input bg-transparent px-3 text-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><ArrowUpRight className="w-4 h-4 text-emerald-600" /> Salgsgrundlag</div><div className="text-xl font-bold mt-1">{formatDKK(data.sales_basis)}</div><div className="text-xs text-slate-400">{data.salesCount} fakturaer</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><Percent className="w-4 h-4 text-emerald-600" /> Udgående moms</div><div className="text-xl font-bold mt-1 text-emerald-600">{formatDKK(data.output_vat)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><ArrowDownLeft className="w-4 h-4 text-blue-600" /> Købsgrundlag</div><div className="text-xl font-bold mt-1">{formatDKK(data.purchase_basis)}</div><div className="text-xs text-slate-400">{data.purchaseCount} fakturaer</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><Percent className="w-4 h-4 text-blue-600" /> Indgående moms</div><div className="text-xl font-bold mt-1 text-blue-600">{formatDKK(data.input_vat)}</div></CardContent></Card>
      </div>

      <Card className={data.payable >= 0 ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-slate-500">{data.payable >= 0 ? 'Moms at betale til SKAT' : 'Moms til godtgørelse'}</div>
              <div className={`text-3xl font-bold mt-1 ${data.payable >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{formatDKK(Math.abs(data.payable))}</div>
              <div className="text-xs text-slate-400 mt-1">Periode: {MONTHS[periodMonth]} {periodYear} · Frist: 20. i næste måned</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1" /> Eksportér</Button>
              <Button onClick={submitVat} disabled={alreadyReported}>{alreadyReported ? 'Indberettet ✓' : 'Indberet til SKAT'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Moms historik (12 mdr)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.history} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
              <Tooltip formatter={(v) => formatDKK(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="udgaaende" name="Udgående moms" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="indgaaende" name="Indgående moms" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {vatReports.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Tidligere momsangivelser</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {vatReports.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 text-sm">
                  <span className="text-slate-700">{r.period}</span>
                  <span className="text-slate-500">{formatDKK(r.payable_vat || 0)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'Betalt' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Indberettet' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}