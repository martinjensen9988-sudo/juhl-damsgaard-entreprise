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
import { formatDKK, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const TYPES = ['Drift', 'Vedligeholdelse', 'Serviceeftersyn', 'Garanti'];
const STATUSES = ['Aktiv', 'Pauset', 'Udløbet', 'Opsagt'];

const STATUS_BADGE = {
  Aktiv: 'bg-emerald-100 text-emerald-700',
  Pauset: 'bg-amber-100 text-amber-700',
  Udløbet: 'bg-slate-200 text-slate-500',
  Opsagt: 'bg-red-100 text-red-700',
};

const TYPE_BADGE = {
  Drift: 'bg-blue-100 text-blue-700',
  Vedligeholdelse: 'bg-purple-100 text-purple-700',
  Serviceeftersyn: 'bg-cyan-100 text-cyan-700',
  Garanti: 'bg-slate-100 text-slate-600',
};

const EMPTY = {
  title: '', customer_id: '', customer_name: '', customer_email: '',
  project_id: '', project_name: '', type: 'Vedligeholdelse', status: 'Aktiv',
  start_date: '', end_date: '', interval_months: 12, next_service_date: '',
  annual_value: '', notes: '',
};

export default function Serviceaftaler() {
  const [agreements, setAgreements] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, c, p] = await Promise.all([
        base44.entities.ServiceAgreement.list('-created_date', 200),
        base44.entities.Customer.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setAgreements(a);
      setCustomers(c);
      setProjects(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filterStatus === 'all' ? agreements : agreements.filter((a) => a.status === filterStatus);

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (a) => a.status === 'Aktiv' && a.next_service_date && a.next_service_date < today;

  const totalAnnual = agreements.filter((a) => a.status === 'Aktiv').reduce((s, a) => s + (a.annual_value || 0), 0);
  const overdueCount = agreements.filter(isOverdue).length;

  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (a) => {
    setForm({ ...EMPTY, ...a, annual_value: a.annual_value ?? '' });
    setEditing(a);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, annual_value: form.annual_value ? Number(form.annual_value) : null, interval_months: Number(form.interval_months) || 12 };
      if (editing) {
        await base44.entities.ServiceAgreement.update(editing.id, payload);
      } else {
        await base44.entities.ServiceAgreement.create(payload);
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
    if (!confirm('Slet denne serviceaftale?')) return;
    await base44.entities.ServiceAgreement.delete(id);
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const selectCustomer = (id) => {
    const c = customers.find((c) => c.id === id);
    setForm({ ...form, customer_id: id, customer_name: c?.name || '', customer_email: c?.email || '' });
  };

  const selectProject = (id) => {
    const p = projects.find((p) => p.id === id);
    setForm({ ...form, project_id: id, project_name: p?.name || '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Serviceaftaler</h1>
          <p className="text-slate-500 mt-1">Tilbagevendende service- og vedligeholdelsesaftaler</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Ny aftale
        </Button>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><RefreshCw className="w-4 h-4" /> Aktive aftaler</div>
          <div className="text-xl font-bold text-slate-900">{agreements.filter((a) => a.status === 'Aktiv').length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><CheckCircle2 className="w-4 h-4" /> Årlig tilbagevendende værdi</div>
          <div className="text-xl font-bold text-emerald-600">{formatDKK(totalAnnual)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><AlertCircle className="w-4 h-4" /> Forfaldne service</div>
          <div className={`text-xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdueCount}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm text-slate-600">Filtrer status:</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen serviceaftaler fundet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const overdue = isOverdue(a);
            return (
              <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[a.type] || 'bg-slate-100 text-slate-500'}`}>{a.type}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[a.status] || 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => openEdit(a)} className="text-slate-400 hover:text-slate-700 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(a.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="font-semibold text-slate-900 mb-1 truncate">{a.title}</div>
                <div className="text-sm text-slate-500 mb-3">{a.customer_name || '—'}</div>
                <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
                  <div>
                    <div className="text-xs text-slate-400">Næste service</div>
                    <div className={`font-medium ${overdue ? 'text-red-600' : 'text-slate-700'}`}>
                      {a.next_service_date ? formatDate(a.next_service_date) : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Årlig værdi</div>
                    <div className="font-semibold text-slate-900">{a.annual_value ? formatDKK(a.annual_value) : '—'}</div>
                  </div>
                </div>
                {overdue && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Service forfalden
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger aftale' : 'Ny serviceaftale'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Titel *</Label>
              <Input value={form.title} onChange={set('title')} placeholder="F.eks. Årligt serviceeftersyn" />
            </div>
            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <Select value={form.customer_id} onValueChange={selectCustomer}>
                <SelectTrigger><SelectValue placeholder="Vælg kunde" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={selectProject}>
                <SelectTrigger><SelectValue placeholder="Valgfrit" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Startdato</Label>
              <Input type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Slutdato</Label>
              <Input type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Næste service</Label>
              <Input type="date" value={form.next_service_date} onChange={set('next_service_date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Interval (måneder)</Label>
              <Input type="number" value={form.interval_months} onChange={set('interval_months')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Årlig værdi (DKK)</Label>
              <Input type="number" value={form.annual_value} onChange={set('annual_value')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Noter</Label>
              <Textarea value={form.notes || ''} onChange={set('notes')} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.title}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}