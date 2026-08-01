import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import LineItemEditor from '@/components/LineItemEditor';
import { formatDKK, calcSubtotal, calcVAT, calcTotal, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';

const STATUSES = ['Kladde', 'Sendt', 'Betalt', 'Forfalden', 'Annulleret'];

const STATUS_BADGE = {
  Kladde: 'bg-slate-100 text-slate-500',
  Sendt: 'bg-blue-100 text-blue-700',
  Betalt: 'bg-emerald-100 text-emerald-700',
  Forfalden: 'bg-red-100 text-red-700',
  Annulleret: 'bg-slate-200 text-slate-600',
};

function nextNumber(prefix, existing) {
  const year = new Date().getFullYear();
  const nums = existing
    .filter((x) => x && x.startsWith(`${prefix}-${year}`))
    .map((x) => parseInt(x.split('-').pop(), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, c, p] = await Promise.all([
        base44.entities.Invoice.list('-created_date', 100),
        base44.entities.Customer.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setInvoices(inv);
      setCustomers(c);
      setProjects(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const blankForm = () => {
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 30);
    return {
      invoice_number: nextNumber('FAK', invoices.map((i) => i.invoice_number)),
      customer_id: '',
      customer_name: '',
      project_id: '',
      project_name: '',
      quote_id: '',
      status: 'Kladde',
      date: today.toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
      line_items: [{ description: '', quantity: 1, unit: 'stk', unit_price: 0 }],
      paid_amount: 0,
      notes: '',
    };
  };

  const openNew = () => {
    setForm(blankForm());
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (inv) => {
    setForm({ ...inv, line_items: inv.line_items || [] });
    setEditing(inv);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const customer = customers.find((c) => c.id === form.customer_id);
      const project = projects.find((p) => p.id === form.project_id);
      const payload = {
        ...form,
        customer_name: customer ? customer.company || customer.name : '',
        customer_email: customer ? customer.email : '',
        project_name: project ? project.name : '',
      };
      if (editing) {
        await base44.entities.Invoice.update(editing.id, payload);
      } else {
        await base44.entities.Invoice.create(payload);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Slet denne faktura?')) return;
    await base44.entities.Invoice.delete(id);
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const totalUnpaid = invoices
    .filter((i) => i.status === 'Sendt' || i.status === 'Forfalden')
    .reduce((sum, inv) => sum + calcTotal(inv.line_items), 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'Betalt')
    .reduce((sum, inv) => sum + calcTotal(inv.line_items), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Fakturaer</h1>
          <p className="text-slate-500 mt-1">Opret og følg op på dine fakturaer</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Ny faktura
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5">
          <div className="text-sm text-emerald-700">Betalt</div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{formatDKK(totalPaid)}</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-5">
          <div className="text-sm text-red-700">Udestående</div>
          <div className="text-2xl font-bold text-red-900 mt-1">{formatDKK(totalUnpaid)}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen fakturaer endnu. Opret din første faktura.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Fakturanr.</th>
                  <th className="px-4 py-3">Kunde</th>
                  <th className="px-4 py-3">Dato</th>
                  <th className="px-4 py-3">Forfald</th>
                  <th className="px-4 py-3 text-right">Beløb</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Handlinger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatDKK(calcTotal(inv.line_items))}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status] || 'bg-slate-100 text-slate-500'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(inv)}>
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(inv.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
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

      {form && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Rediger faktura' : 'Ny faktura'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Fakturanr.</Label>
                  <Input value={form.invoice_number} onChange={set('invoice_number')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fakturadato</Label>
                  <Input type="date" value={form.date || ''} onChange={set('date')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Forfaldsdato</Label>
                  <Input type="date" value={form.due_date || ''} onChange={set('due_date')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kunde</Label>
                  <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Vælg kunde" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Projekt</Label>
                  <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Linjer</Label>
                <LineItemEditor
                  items={form.line_items}
                  onChange={(items) => setForm({ ...form, line_items: items })}
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatDKK(calcSubtotal(form.line_items))}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Moms (25%)</span>
                  <span>{formatDKK(calcVAT(calcSubtotal(form.line_items)))}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatDKK(calcTotal(form.line_items))}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Bemærkninger</Label>
                <Textarea value={form.notes || ''} onChange={set('notes')} rows={2} placeholder="Bemærkninger på faktura" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
              <Button onClick={save} disabled={saving || !form.invoice_number}>
                {saving ? 'Gemmer...' : 'Gem faktura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}