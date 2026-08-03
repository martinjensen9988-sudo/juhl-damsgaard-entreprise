import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateInvoicePDF } from '@/lib/invoicePdf';
import { formatDKK, calcTotal, formatDate } from '@/lib/format';
import { Archive, Search, Download, Receipt } from 'lucide-react';

const STATUSES = ['Alle', 'Sendt', 'Betalt', 'Forfalden', 'Annulleret', 'Kladde'];

const STATUS_BADGE = {
  Kladde: 'bg-slate-100 text-slate-500',
  Sendt: 'bg-blue-100 text-blue-700',
  Betalt: 'bg-emerald-100 text-emerald-700',
  Forfalden: 'bg-red-100 text-red-700',
  Annulleret: 'bg-slate-200 text-slate-600',
};

export default function Fakturaarkiv() {
  const [invoices, setInvoices] = useState([]);
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [pdfLoading, setPdfLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, cs] = await Promise.all([
        base44.entities.Invoice.list('-created_date', 200),
        base44.entities.CompanySettings.list('-created_date', 10),
      ]);
      setInvoices(inv);
      setCompany(cs[0] || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== 'Alle' && inv.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        inv.invoice_number,
        inv.customer_name,
        inv.project_name,
        inv.notes,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [invoices, search, statusFilter]);

  const downloadPDF = async (inv) => {
    setPdfLoading(inv.id);
    try {
      await generateInvoicePDF(inv, company);
    } catch (e) {
      alert('Kunne ikke generere PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  const totalSent = invoices.filter((i) => i.status !== 'Kladde').length;
  const totalOutstanding = invoices
    .filter((i) => i.status === 'Sendt' || i.status === 'Forfalden')
    .reduce((sum, inv) => sum + calcTotal(inv.line_items), 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'Betalt')
    .reduce((sum, inv) => sum + calcTotal(inv.line_items), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Archive className="w-7 h-7 text-slate-700" /> Fakturaarkiv
        </h1>
        <p className="text-slate-500 mt-1">Alle afsendte fakturaer samlet ét sted</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500">Fakturaer i alt</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalSent}</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <div className="text-sm text-emerald-700">Betalt</div>
          <div className="text-xl font-bold text-emerald-900 mt-1">{formatDKK(totalPaid)}</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <div className="text-sm text-red-700">Udestående</div>
          <div className="text-xl font-bold text-red-900 mt-1">{formatDKK(totalOutstanding)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søg på fakturanr., kunde eller projekt..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {invoices.length === 0 ? 'Ingen fakturaer i arkivet.' : 'Ingen fakturaer matcher din søgning.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Fakturanr.</th>
                  <th className="px-4 py-3">Kunde</th>
                  <th className="px-4 py-3">Projekt</th>
                  <th className="px-4 py-3">Dato</th>
                  <th className="px-4 py-3 text-right">Beløb</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{inv.project_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatDKK(calcTotal(inv.line_items))}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status] || 'bg-slate-100 text-slate-500'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadPDF(inv)}
                          disabled={pdfLoading === inv.id}
                          title="Download PDF-kopi"
                        >
                          {pdfLoading === inv.id ? (
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 text-slate-700" />
                          )}
                        </Button>
                      </div>
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