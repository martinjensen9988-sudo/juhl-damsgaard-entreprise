import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Users, Phone, Mail, Star } from 'lucide-react';

const TRADES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Transport', 'Andet'];
const EMPTY = { name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', cvr: '', trade: 'Gravearbejde', status: 'Aktiv', rating: '', notes: '' };

export default function Underentreprenorer() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([base44.entities.Subcontractor.list('-created_date', 200), base44.entities.Project.list('-created_date', 100)]);
      setItems(s || []); setProjects(p || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (i) => { setForm({ ...EMPTY, ...i, rating: i.rating ?? '' }); setEditing(i); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, rating: form.rating ? Number(form.rating) : null };
      if (editing) { await base44.entities.Subcontractor.update(editing.id, payload); } else { await base44.entities.Subcontractor.create(payload); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet denne underentreprenør?')) return; await base44.entities.Subcontractor.delete(id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center"><Users className="w-6 h-6 text-purple-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Underentreprenører</h1><p className="text-slate-500 mt-0.5">Kontakt, faste priser og tilknyttede projekter</p></div>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Tilføj</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><Users className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen underentreprenører endnu.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((i) => {
            const linked = projects.filter((p) => p.subcontractor_id === i.id);
            return (
              <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{i.name}</div><div className="text-xs text-slate-500">{i.contact_person || '—'}</div></div>
                  <div className="flex items-center gap-1 flex-shrink-0">{i.rating ? <span className="flex items-center gap-0.5 text-xs text-amber-600"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{i.rating}</span> : null}<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${i.status === 'Aktiv' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{i.status}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2"><span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{i.trade}</span></div>
                <div className="space-y-1 text-sm text-slate-600 mb-2">
                  {i.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{i.phone}</div>}
                  {i.email && <div className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-slate-400" />{i.email}</div>}
                </div>
                {linked.length > 0 && <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">Tilknyttet: {linked.map((p) => p.name).join(', ')}</div>}
                <div className="flex justify-end gap-1 pt-2"><Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4 text-slate-500" /></Button><Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger underentreprenør' : 'Ny underentreprenør'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Virksomhed *</Label><Input value={form.name} onChange={set('name')} /></div>
            <div className="space-y-1.5"><Label>Kontaktperson</Label><Input value={form.contact_person} onChange={set('contact_person')} /></div>
            <div className="space-y-1.5"><Label>CVR-nr.</Label><Input value={form.cvr} onChange={set('cvr')} /></div>
            <div className="space-y-1.5"><Label>Telefon</Label><Input value={form.phone} onChange={set('phone')} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={set('email')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Adresse</Label><Input value={form.address} onChange={set('address')} /></div>
            <div className="space-y-1.5"><Label>Postnummer</Label><Input value={form.postal_code} onChange={set('postal_code')} /></div>
            <div className="space-y-1.5"><Label>By</Label><Input value={form.city} onChange={set('city')} /></div>
            <div className="space-y-1.5"><Label>Fag</Label><Select value={form.trade} onValueChange={(v) => setForm({ ...form, trade: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Vurdering (1-5)</Label><Input type="number" min="1" max="5" value={form.rating} onChange={set('rating')} /></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Aktiv">Aktiv</SelectItem><SelectItem value="Inaktiv">Inaktiv</SelectItem></SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Faste priser / noter</Label><Textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="F.eks. fast timepris, rabataftaler..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.name}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}