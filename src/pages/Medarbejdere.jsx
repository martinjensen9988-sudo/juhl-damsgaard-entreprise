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
import { formatDKK } from '@/lib/format';
import { Plus, Pencil, Trash2, Users, Mail, Phone } from 'lucide-react';

const TRADES = ['Gravemaskinefører', 'Anlægsgartner', 'Kloakmester', 'Betonarbejder', 'Lastbilchauffør', 'Håndværker', 'Lærling', 'Andet'];
const STATUSES = ['Aktiv', 'Orlov', 'Inaktiv'];

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  trade: 'Håndværker',
  hourly_rate: '',
  status: 'Aktiv',
  notes: '',
};

const STATUS_BADGE = {
  Aktiv: 'bg-emerald-100 text-emerald-700',
  Orlov: 'bg-amber-100 text-amber-700',
  Inaktiv: 'bg-slate-200 text-slate-500',
};

export default function Medarbejdere() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTrade, setFilterTrade] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Employee.list('-created_date', 200);
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = filterTrade === 'all' ? employees : employees.filter((e) => e.trade === filterTrade);

  const openNew = () => {
    setForm(EMPTY);
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (e) => {
    setForm({ ...EMPTY, ...e, hourly_rate: e.hourly_rate ?? '' });
    setEditing(e);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null };
      if (editing) {
        await base44.entities.Employee.update(editing.id, payload);
      } else {
        await base44.entities.Employee.create(payload);
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
    if (!confirm('Slet denne medarbejder?')) return;
    await base44.entities.Employee.delete(id);
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Medarbejdere</h1>
          <p className="text-slate-500 mt-1">Styr medarbejderoplysninger og tildel opgaver</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Ny medarbejder
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm text-slate-600">Filtrer fag:</Label>
        <Select value={filterTrade} onValueChange={setFilterTrade}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            {TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-500">
          {filtered.filter((e) => e.status === 'Aktiv').length} aktive af {filtered.length} total
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen medarbejdere fundet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Navn</th>
                  <th className="px-4 py-3">Fag</th>
                  <th className="px-4 py-3">Kontakt</th>
                  <th className="px-4 py-3 text-right">Timepris</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{e.name}</div>
                      {e.notes && <div className="text-xs text-slate-400 truncate max-w-xs">{e.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{e.trade}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {e.email && <div className="flex items-center gap-1.5 text-xs"><Mail className="w-3 h-3 text-slate-400" /> {e.email}</div>}
                      {e.phone && <div className="flex items-center gap-1.5 text-xs"><Phone className="w-3 h-3 text-slate-400" /> {e.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{e.hourly_rate ? formatDKK(e.hourly_rate) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[e.status] || 'bg-slate-100 text-slate-500'}`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(e.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger medarbejder' : 'Ny medarbejder'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Navn *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="Fulde navn" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={set('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label>Fag</Label>
              <Select value={form.trade} onValueChange={(v) => setForm({ ...form, trade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
            <div className="col-span-2 space-y-1.5">
              <Label>Timepris (DKK)</Label>
              <Input type="number" value={form.hourly_rate} onChange={set('hourly_rate')} placeholder="395" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Noter</Label>
              <Textarea value={form.notes || ''} onChange={set('notes')} rows={2} placeholder="Færdigheder, certificeringer mm." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.name}>
              {saving ? 'Gemmer...' : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}