import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Truck, Plus, MapPin, ArrowRight, Pencil, Package } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const CATEGORIES = ['Maskine', 'Værktøj', 'Køretøj', 'Stillads', 'Container', 'Andet'];
const STATUS_COLORS = { Ledig: 'bg-emerald-100 text-emerald-700', 'I brug': 'bg-blue-100 text-blue-700', Repair: 'bg-amber-100 text-amber-700', 'Ude af drift': 'bg-red-100 text-red-700' };

export default function MaterielLogistik() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveItem, setMoveItem] = useState(null);
  const [moveForm, setMoveForm] = useState({ location: '', assigned_project_id: '', assigned_project_name: '', status: 'I brug', assigned_to: '', notes: '' });
  const [filterProject, setFilterProject] = useState('all');

  const load = async () => {
    try {
      const [e, p] = await Promise.all([
        base44.entities.Equipment.list('-created_date', 500),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setItems(e); setProjects(p);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((e) => {
    const q = search.toLowerCase();
    if (q && ![e.name, e.location, e.assigned_project_name, e.serial_number].some((v) => (v || '').toLowerCase().includes(q))) return false;
    if (filterProject !== 'all' && e.assigned_project_id !== filterProject) return false;
    return true;
  });

  const openMove = (e) => {
    setMoveItem(e);
    setMoveForm({ location: e.location || '', assigned_project_id: e.assigned_project_id || '', assigned_project_name: e.assigned_project_name || '', status: e.status || 'I brug', assigned_to: e.assigned_to || '', notes: '' });
    setMoveOpen(true);
  };

  const doMove = async () => {
    if (!moveItem) return;
    await base44.entities.Equipment.update(moveItem.id, {
      location: moveForm.location,
      assigned_project_id: moveForm.assigned_project_id,
      assigned_project_name: moveForm.assigned_project_name,
      status: moveForm.status,
      assigned_to: moveForm.assigned_to,
      notes: moveForm.notes ? `${moveItem.notes || ''}\n[Flyttet ${format(new Date(), 'dd. MMM yyyy', { locale: da })}: → ${moveForm.location || '—'}] ${moveForm.notes}`.trim() : (moveItem.notes || ''),
    });
    setMoveOpen(false); setMoveItem(null); load();
  };

  const setProject = (id) => { const p = projects.find((x) => x.id === id); setMoveForm((f) => ({ ...f, assigned_project_id: id, assigned_project_name: p?.name || '' })); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Truck className="w-7 h-7 text-amber-500" /> Materiel-logistik</h1>
        <p className="text-slate-500 mt-1">Registrér flytning af værktøj og maskiner mellem byggepladser</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Søg på navn, lokation, serienr…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white max-w-md" />
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="sm:w-64 bg-white"><span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {filterProject === 'all' ? 'Alle pladser' : projects.find((p) => p.id === filterProject)?.name}</span></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle pladser</SelectItem>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><Package className="w-4 h-4 text-amber-600" /></div>
                  <div><div className="font-semibold text-slate-900">{e.name}</div><div className="text-xs text-slate-500">{e.category}{e.serial_number ? ` · SN ${e.serial_number}` : ''}</div></div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[e.status] || STATUS_COLORS.Ledig}`}>{e.status}</span>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {e.location || 'Ingen lokation'}</div>
                {e.assigned_project_name && <div className="flex items-center gap-2 text-slate-600"><ArrowRight className="w-3.5 h-3.5 text-slate-400" /> {e.assigned_project_name}</div>}
                {e.assigned_to && <div className="text-xs text-slate-500">Tildelt: {e.assigned_to}</div>}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => openMove(e)}><Truck className="w-3.5 h-3.5" /> Flyt materiel</Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Flyt materiel: {moveItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-slate-500">Nuværende lokation: <span className="font-medium text-slate-700">{moveItem?.location || '—'}</span></div>
            <div><Label>Ny lokation / byggeplads *</Label><Input value={moveForm.location} onChange={(e) => setMoveForm({ ...moveForm, location: e.target.value })} placeholder="F.eks. Byggeplads Nørrebro" /></div>
            <div><Label>Tildelt projekt</Label>
              <Select value={moveForm.assigned_project_id} onValueChange={setProject}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Status</Label>
                <Select value={moveForm.status} onValueChange={(v) => setMoveForm({ ...moveForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Ledig', 'I brug', 'Reparation', 'Ude af drift'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Tildelt til</Label><Input value={moveForm.assigned_to} onChange={(e) => setMoveForm({ ...moveForm, assigned_to: e.target.value })} /></div>
            </div>
            <div><Label>Bemærkning til flytning</Label><Textarea value={moveForm.notes} onChange={(e) => setMoveForm({ ...moveForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMoveOpen(false)}>Annuller</Button><Button onClick={doMove} disabled={!moveForm.location} className="bg-amber-500 hover:bg-amber-600">Bekræft flytning</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}