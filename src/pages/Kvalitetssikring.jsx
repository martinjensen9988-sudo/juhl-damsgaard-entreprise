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
import { Plus, Pencil, Trash2, ShieldCheck, Check, X } from 'lucide-react';

const TYPES = ['Færdigmelding', 'AR-bevis', 'Sikkerhedsinspektion', 'Selvangivelse', 'Varmeinstallation', 'Andet'];
const STATUSES = ['Ikke startet', 'I gang', 'Godkendt', 'Afvigelse'];

const STATUS_BADGE = {
  'Ikke startet': 'bg-slate-100 text-slate-500',
  'I gang': 'bg-blue-100 text-blue-700',
  'Godkendt': 'bg-emerald-100 text-emerald-700',
  'Afvigelse': 'bg-red-100 text-red-700',
};

const DEFAULT_ITEMS = {
  Færdigmelding: [
    { description: 'Arbejdet er udført i overensstemmelse med tilbud og aftale', checked: false, notes: '' },
    { description: 'Materialer leveres og er monteret korrekt', checked: false, notes: '' },
    { description: 'Byggeplads afryddes og affald fjernes', checked: false, notes: '' },
    { description: 'Kunden har gennemgået arbejdet og er tilfreds', checked: false, notes: '' },
  ],
  'AR-bevis': [
    { description: 'Arbejdsmiljøudvalg er informeret', checked: false, notes: '' },
    { description: 'Risikovurdering udfyldt', checked: false, notes: '' },
    { description: 'Sikkerhedsudstyr er til stede og intakt', checked: false, notes: '' },
    { description: 'Medarbejdere instrueret i sikkerhedsprocedurer', checked: false, notes: '' },
  ],
  Sikkerhedsinspektion: [
    { description: 'Byggeplads sikret mod uvedkommende', checked: false, notes: '' },
    { description: 'Faldsikring installeret hvor nødvendigt', checked: false, notes: '' },
    { description: 'Strøm og vand sikret', checked: false, notes: '' },
    { description: 'Brandslukker tilgængelig', checked: false, notes: '' },
  ],
};

const EMPTY = {
  title: '', project_id: '', project_name: '', customer_email: '',
  type: 'Færdigmelding', status: 'Ikke startet', items: [], checked_by: '', check_date: '', notes: '',
};

export default function Kvalitetssikring() {
  const [checks, setChecks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        base44.entities.QualityCheck.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setChecks(c);
      setProjects(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filterType === 'all' ? checks : checks.filter((c) => c.type === filterType);

  const openNew = () => {
    setForm({ ...EMPTY, items: DEFAULT_ITEMS['Færdigmelding'] || [], check_date: new Date().toISOString().slice(0, 10) });
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (c) => {
    setForm({ ...EMPTY, ...c, items: c.items || [] });
    setEditing(c);
    setDialogOpen(true);
  };

  const selectProject = (id) => {
    const p = projects.find((p) => p.id === id);
    setForm({ ...form, project_id: id, project_name: p?.name || '', customer_email: p?.customer_email || '' });
  };

  const changeType = (type) => {
    if (!editing && DEFAULT_ITEMS[type]) {
      setForm({ ...form, type, items: DEFAULT_ITEMS[type] });
    } else {
      setForm({ ...form, type });
    }
  };

  const toggleItem = (idx) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], checked: !items[idx].checked };
    setForm({ ...form, items });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', checked: false, notes: '' }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const save = async () => {
    setSaving(true);
    try {
      const checkedCount = form.items.filter((i) => i.checked).length;
      const status = checkedCount === form.items.length && form.items.length > 0 ? 'Godkendt' : checkedCount > 0 ? 'I gang' : form.status;
      const payload = { ...form, status };
      if (editing) {
        await base44.entities.QualityCheck.update(editing.id, payload);
      } else {
        await base44.entities.QualityCheck.create(payload);
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
    if (!confirm('Slet dette tjek?')) return;
    await base44.entities.QualityCheck.delete(id);
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kvalitetssikring</h1>
          <p className="text-slate-500 mt-1">Lovpligtige tjeklister og dokumentation</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Nyt tjek
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm text-slate-600">Filtrer type:</Label>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen kvalitetstjek oprettet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const checkedCount = (c.items || []).filter((i) => i.checked).length;
            const total = (c.items || []).length;
            const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] || 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                  <div className="flex gap-0.5">
                    <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-slate-700 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(c.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="font-semibold text-slate-900 mb-1 truncate">{c.title}</div>
                <div className="text-sm text-slate-500 mb-2">{c.project_name || '—'}</div>
                <div className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 mb-3">{c.type}</div>
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{checkedCount}/{total} tjekpunkter</span>
                    <span className="font-medium text-slate-700">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-slate-500" /> {editing ? 'Rediger tjek' : 'Nyt kvalitetstjek'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Titel *</Label>
                <Input value={form.title} onChange={set('title')} placeholder="F.eks. Færdigmelding kloakrenovering" />
              </div>
              <div className="space-y-1.5">
                <Label>Projekt</Label>
                <Select value={form.project_id} onValueChange={selectProject}>
                  <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={changeType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tjekket af</Label>
                <Input value={form.checked_by} onChange={set('checked_by')} placeholder="Navn" />
              </div>
              <div className="space-y-1.5">
                <Label>Dato</Label>
                <Input type="date" value={form.check_date || ''} onChange={set('check_date')} />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Tjekpunkter</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tilføj punkt
                </Button>
              </div>
              {form.items.length === 0 ? (
                <div className="text-sm text-slate-400 py-4 text-center bg-slate-50 rounded-lg">Ingen tjekpunkter. Tilføj et punkt eller vælg en type med standardpunkter.</div>
              ) : (
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3">
                      <button
                        type="button"
                        onClick={() => toggleItem(idx)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-slate-400'}`}
                      >
                        {item.checked && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 space-y-1">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          placeholder="Beskrivelse af tjekpunkt"
                          className="text-sm bg-white"
                        />
                        <Input
                          value={item.notes || ''}
                          onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                          placeholder="Noter (valgfrit)"
                          className="text-xs bg-white"
                        />
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="mt-1 text-slate-400 hover:text-red-500 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Supplerende noter</Label>
              <Textarea value={form.notes || ''} onChange={set('notes')} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.title}>{saving ? 'Gemmer...' : 'Gem tjek'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}