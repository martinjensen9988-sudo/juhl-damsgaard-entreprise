import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Briefcase, Plus, Pencil, Trash2, Mail, Phone, Star, FolderOpen, Link2 } from 'lucide-react';

const TRADES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Transport', 'Andet'];
const STATUSES = ['Aktiv', 'Inaktiv'];

const emptySub = {
  name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '',
  cvr: '', trade: 'Gravearbejde', status: 'Aktiv', rating: 0, notes: '',
};

export default function Underentreprenoerer() {
  const [subs, setSubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptySub);
  const [detailSub, setDetailSub] = useState(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkProjectId, setLinkProjectId] = useState('');

  const load = async () => {
    try {
      const [subData, projData] = await Promise.all([
        base44.entities.Subcontractor.list(),
        base44.entities.Project.list(),
      ]);
      setSubs(subData);
      setProjects(projData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptySub); setDialogOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...emptySub, ...s }); setDialogOpen(true); };

  const save = async () => {
    if (editing) await base44.entities.Subcontractor.update(editing.id, form);
    else await base44.entities.Subcontractor.create(form);
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Slet denne underentreprenør?')) return;
    await base44.entities.Subcontractor.delete(id);
    load();
  };

  const assignProject = async () => {
    const proj = projects.find((p) => p.id === linkProjectId);
    if (!proj || !detailSub) return;
    await base44.entities.Project.update(proj.id, { subcontractor_id: detailSub.id, subcontractor_name: detailSub.name });
    setLinkDialogOpen(false);
    setLinkProjectId('');
    load();
  };

  const unassignProject = async (proj) => {
    await base44.entities.Project.update(proj.id, { subcontractor_id: '', subcontractor_name: '' });
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const subProjects = (subId) => projects.filter((p) => p.subcontractor_id === subId);
  const unassignedProjects = projects.filter((p) => !p.subcontractor_id);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Underentreprenører</h1>
          <p className="text-sm text-slate-500 mt-1">Administration af underentreprenører og tilknyttede projekter</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tilføj</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subs.map((s) => {
          const sProjects = subProjects(s.id);
          return (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.trade}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.status === 'Aktiv' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                </div>

                {s.contact_person && <div className="text-sm text-slate-600 mb-1">{s.contact_person}</div>}
                <div className="space-y-1 text-sm text-slate-500">
                  {s.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {s.email}</div>}
                  {s.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {s.phone}</div>}
                </div>

                {s.rating > 0 && (
                  <div className="flex items-center gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= s.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm">
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{sProjects.length} projekt(er)</span>
                </div>
              </div>
              <div className="flex border-t border-slate-100">
                <button onClick={() => setDetailSub(s)} className="flex-1 py-2.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Projekter</button>
                <button onClick={() => openEdit(s)} className="flex-1 py-2.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5 border-l border-slate-100"><Pencil className="w-3.5 h-3.5" /> Rediger</button>
                <button onClick={() => remove(s.id)} className="flex-1 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 border-l border-slate-100"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {subs.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Ingen underentreprenører registreret</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger underentreprenør' : 'Tilføj underentreprenør'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Virksomhed *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <Label>Kontaktperson</Label>
              <Input value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <Label>CVR-nr.</Label>
              <Input value={form.cvr} onChange={(e) => set('cvr', e.target.value)} />
            </div>
            <div>
              <Label>Fag</Label>
              <Select value={form.trade} onValueChange={(v) => set('trade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vurdering (1-5)</Label>
              <Input type="number" min="0" max="5" value={form.rating} onChange={(e) => set('rating', Number(e.target.value))} />
            </div>
            <div className="col-span-2">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div>
              <Label>Postnummer</Label>
              <Input value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} />
            </div>
            <div>
              <Label>By</Label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Noter</Label>
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={!form.name}>Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailSub} onOpenChange={(open) => !open && setDetailSub(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailSub?.name} — tilknyttede projekter</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mb-4">
            {subProjects(detailSub?.id).length === 0 ? (
              <p className="text-sm text-slate-500">Ingen tilknyttede projekter</p>
            ) : (
              subProjects(detailSub?.id).map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.status} • {p.customer_name || '—'}</div>
                  </div>
                  <button onClick={() => unassignProject(p)} className="text-xs text-red-500 hover:text-red-700">Fjern</button>
                </div>
              ))
            )}
          </div>
          <div className="border-t pt-4">
            <Button onClick={() => setLinkDialogOpen(true)} variant="outline" className="gap-2 w-full"><Link2 className="w-4 h-4" /> Tildel projekt</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tildel projekt til {detailSub?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unassignedProjects.length === 0 ? (
              <p className="text-sm text-slate-500">Ingen ledige projekter</p>
            ) : (
              unassignedProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setLinkProjectId(p.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition ${linkProjectId === p.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="text-sm font-medium text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.status} • {p.customer_name || '—'}</div>
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Annuller</Button>
            <Button onClick={assignProject} disabled={!linkProjectId}>Tildel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}