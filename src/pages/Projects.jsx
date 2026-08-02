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
import { Plus, Pencil, Trash2, HardHat, Calendar, MapPin, ClipboardList, LayoutGrid, List } from 'lucide-react';
import ArbejdsseddelDialog from '@/components/ArbejdsseddelDialog';
import ProjectKanban from '@/components/ProjectKanban';

const PROJECT_TYPES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Andet'];
const STATUSES = ['Planlægning', 'I gang', 'Afsluttet', 'På hold'];

const EMPTY = {
  name: '',
  customer_id: '',
  customer_name: '',
  description: '',
  type: 'Anlæg',
  status: 'Planlægning',
  start_date: '',
  end_date: '',
  budget: '',
  address: '',
};

const STATUS_BADGE = {
  Planlægning: 'bg-amber-100 text-amber-700',
  'I gang': 'bg-blue-100 text-blue-700',
  Afsluttet: 'bg-emerald-100 text-emerald-700',
  'På hold': 'bg-slate-200 text-slate-600',
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [worksheetProject, setWorksheetProject] = useState(null);
  const [view, setView] = useState('list');

  const moveStatus = async (id, status) => {
    try {
      await base44.entities.Project.update(id, { status });
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch (e) {
      console.error(e);
      load();
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        base44.entities.Project.list('-created_date', 100),
        base44.entities.Customer.list('-created_date', 200),
      ]);
      setProjects(p);
      setCustomers(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(EMPTY);
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setForm({ ...EMPTY, ...p, budget: p.budget ?? '' });
    setEditing(p);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const customer = customers.find((c) => c.id === form.customer_id);
      const payload = {
        ...form,
        budget: form.budget ? Number(form.budget) : null,
        customer_name: customer ? customer.company || customer.name : '',
        customer_email: customer ? customer.email : '',
      };
      if (editing) {
        await base44.entities.Project.update(editing.id, payload);
      } else {
        await base44.entities.Project.create(payload);
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
    if (!confirm('Slet dette projekt?')) return;
    await base44.entities.Project.delete(id);
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projekter</h1>
          <p className="text-slate-500 mt-1">Styr alle dine entrepriseprojekter</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'list' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <List className="w-4 h-4" /> Liste
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'kanban' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Kanban
            </button>
          </div>
          <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-1.5" /> Nyt projekt
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <HardHat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen projekter endnu. Opret dit første projekt.</p>
        </div>
      ) : view === 'kanban' ? (
        <ProjectKanban projects={projects} onMove={moveStatus} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                  <div className="text-sm text-slate-500">{p.customer_name || '—'}</div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${STATUS_BADGE[p.status] || 'bg-slate-100 text-slate-500'}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                  {p.type}
                </span>
              </div>
              {p.description && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{p.description}</p>
              )}
              <div className="space-y-1 text-xs text-slate-500 mb-3">
                {p.start_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(p.start_date)}{p.end_date ? ` → ${formatDate(p.end_date)}` : ''}
                  </div>
                )}
                {p.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{p.address}</span>
                  </div>
                )}
              </div>
              {p.budget != null && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Budget</span>
                  <span className="font-semibold text-slate-900">{formatDKK(p.budget)}</span>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full mb-2" onClick={() => setWorksheetProject(p)}>
                <ClipboardList className="w-4 h-4 mr-1.5" /> Arbejdsseddel
              </Button>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                  <Pencil className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger projekt' : 'Nyt projekt'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Projektnavn *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="F.eks. Kloakrenovering Strandvejen" />
            </div>
            <div className="col-span-2 space-y-1.5">
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
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
            <div className="space-y-1.5">
              <Label>Startdato</Label>
              <Input type="date" value={form.start_date || ''} onChange={set('start_date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Slutdato</Label>
              <Input type="date" value={form.end_date || ''} onChange={set('end_date')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={set('address')} placeholder="Projektadresse" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Budget (DKK)</Label>
              <Input type="number" value={form.budget} onChange={set('budget')} placeholder="0" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Beskrivelse</Label>
              <Textarea value={form.description} onChange={set('description')} rows={3} placeholder="Beskrivelse af projektet" />
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

      <ArbejdsseddelDialog project={worksheetProject} onClose={() => setWorksheetProject(null)} />
    </div>
  );
}