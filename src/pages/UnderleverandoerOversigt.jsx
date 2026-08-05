import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, Star, Phone, Mail, MapPin, Building2, Briefcase } from 'lucide-react';

const TRADES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Transport', 'Andet'];

const empty = {
  name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '',
  city: '', cvr: '', trade: 'Gravearbejde', status: 'Aktiv', rating: 0, notes: '',
};

export default function UnderleverandoerOversigt() {
  const [subs, setSubs] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [s, p] = await Promise.all([
      base44.entities.Subcontractor.list('-updated_date', 200),
      base44.entities.Project.list('-updated_date', 500),
    ]);
    setSubs(s);
    setProjects(p);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (editing.id) await base44.entities.Subcontractor.update(editing.id, editing);
      else await base44.entities.Subcontractor.create(editing);
      setEditing(null);
      await load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const linkedProjects = (sub) =>
    projects.filter((p) => p.subcontractor_id === sub.id || (sub.name && p.subcontractor_name === sub.name));

  if (!subs) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Underleverandør Oversigt</h1>
          <p className="text-slate-500 mt-1">Styring af underleverandører, aftaler og tilknyttede projekter</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Tilføj underleverandør
        </Button>
      </div>

      {subs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Ingen underleverandører registreret endnu.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subs.map((s) => {
            const linked = linkedProjects(s);
            return (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{s.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {s.trade}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setEditing(s)} className="text-slate-400 hover:text-slate-700">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {s.contact_person && <div className="text-sm text-slate-700">{s.contact_person}</div>}

                <div className="space-y-1 text-xs text-slate-500">
                  {s.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {s.phone}</div>}
                  {s.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {s.email}</div>}
                  {(s.city || s.address) && (
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {[s.address, s.postal_code, s.city].filter(Boolean).join(', ')}</div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= (s.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'Aktiv' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.status}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Tilknyttede projekter ({linked.length})</div>
                  {linked.length === 0 ? (
                    <div className="text-xs text-slate-400">Ingen aktive projekter</div>
                  ) : (
                    <div className="space-y-1">
                      {linked.slice(0, 4).map((p) => (
                        <div key={p.id} className="text-xs text-slate-700 flex justify-between">
                          <span className="truncate">{p.name}</span>
                          <span className="text-slate-400 ml-2">{p.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Rediger underleverandør' : 'Ny underleverandør'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Virksomhed *</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Kontaktperson</Label>
                <Input value={editing.contact_person} onChange={(e) => setEditing({ ...editing, contact_person: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>CVR-nr.</Label>
                <Input value={editing.cvr} onChange={(e) => setEditing({ ...editing, cvr: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Adresse</Label>
                <Input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Postnummer</Label>
                <Input value={editing.postal_code} onChange={(e) => setEditing({ ...editing, postal_code: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>By</Label>
                <Input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Fag</Label>
                <Select value={editing.trade} onValueChange={(v) => setEditing({ ...editing, trade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vurdering (1-5)</Label>
                <Input type="number" min="0" max="5" value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Noter</Label>
                <Input value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !editing?.name}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              {saving ? 'Gemmer...' : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}