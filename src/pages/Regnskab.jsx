import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { formatDKK, calcTotal, formatDate } from '@/lib/format';
import { Download, FileSpreadsheet, Settings, ExternalLink } from 'lucide-react';

const STATUS_BADGE = {
  Kladde: 'bg-slate-100 text-slate-500',
  Sendt: 'bg-blue-100 text-blue-700',
  Betalt: 'bg-emerald-100 text-emerald-700',
  Forfalden: 'bg-red-100 text-red-700',
  Annulleret: 'bg-slate-200 text-slate-500',
};

function toCSV(invoices) {
  const headers = ['Fakturanr.', 'Dato', 'Forfaldsdato', 'Kundenavn', 'Beskrivelse', 'Beløb', 'Moms', 'Total', 'Status'];
  const rows = invoices.map((inv) => {
    const subtotal = inv.line_items?.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0) || 0;
    const vat = subtotal * 0.25;
    const total = subtotal + vat;
    const desc = inv.line_items?.map((i) => `${i.description} (${i.quantity} ${i.unit})`).join('; ') || '';
    return [
      inv.invoice_number || '',
      inv.date || '',
      inv.due_date || '',
      inv.customer_name || '',
      desc,
      subtotal.toFixed(2),
      vat.toFixed(2),
      total.toFixed(2),
      inv.status || '',
    ];
  });
  return [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Regnskab() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [system, setSystem] = useState('dinero');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Invoice.list('-created_date', 200);
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === invoices.length) setSelected(new Set());
    else setSelected(new Set(invoices.map((i) => i.id)));
  };

  const exportSelected = () => {
    const toExport = invoices.filter((i) => selected.has(i.id));
    if (toExport.length === 0) return;
    const csv = toCSV(toExport);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `faktura-export-${system}-${date}.csv`);
  };

  const exportAll = () => {
    if (invoices.length === 0) return;
    const csv = toCSV(invoices);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `faktura-export-${system}-${date}.csv`);
  };

  const exportableInvoices = invoices.filter((i) => i.status === 'Sendt' || i.status === 'Betalt');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Regnskabsintegration</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Eksportér fakturaer til dit regnskabssystem</p>
      </div>

      {/* System selector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Regnskabssystem</h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[
            { key: 'dinero', label: 'Dinero', url: 'https://dinero.dk' },
            { key: 'economic', label: 'e-conomic', url: 'https://e-conomic.dk' },
            { key: 'billy', label: 'Billy', url: 'https://billy.dk' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSystem(s.key)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                system === s.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
          <ExternalLink className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Sådan eksporterer du:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Vælg fakturaer nedenfor og klik "Eksportér valgte"</li>
              <li>CSV-filen downloades med semikolon-separerede værdier</li>
              <li>Log ind i {system === 'dinero' ? 'Dinero' : system === 'economic' ? 'e-conomic' : 'Billy'} og importér CSV-filen</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Export bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">{selected.size}</span> valgt af {invoices.length} fakturaer
          <span className="ml-2">({exportableInvoices.length} eksportable)</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAll} disabled={invoices.length === 0}>
            <Download className="w-4 h-4 mr-1.5" /> Eksportér alle
          </Button>
          <Button onClick={exportSelected} disabled={selected.size === 0} className="bg-slate-950 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-1.5" /> Eksportér valgte ({selected.size})
          </Button>
        </div>
      </div>

      {/* Invoice table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 py-16 text-center">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Ingen fakturaer at eksportere.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm mobile-cards">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === invoices.length && invoices.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-slate-900"
                    />
                  </th>
                  <th className="px-4 py-3">Fakturanr.</th>
                  <th className="px-4 py-3">Kunde</th>
                  <th className="px-4 py-3">Dato</th>
                  <th className="px-4 py-3 text-right">Beløb</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3" data-label="Vælg">
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggle(inv.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-slate-900"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100" data-label="Fakturanr.">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300" data-label="Kunde">{inv.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400" data-label="Dato">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100" data-label="Beløb">{formatDKK(calcTotal(inv.line_items))}</td>
                    <td className="px-4 py-3" data-label="Status">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status] || 'bg-slate-100 text-slate-500'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}