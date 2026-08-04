import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';

const CATS = ['Arbejdsmiljø', 'Sikkerhedsprotokol', 'Vejledning', 'Riskikovurdering', 'Værneudstyr', 'Andet'];
const RISK = { Lav: 'bg-emerald-100 text-emerald-700', Mellem: 'bg-amber-100 text-amber-700', Høj: 'bg-orange-100 text-orange-700', Kritisk: 'bg-red-100 text-red-700' };
const empty = { title: '', category: 'Arbejdsmiljø', risk_level: 'Mellem', content: '', required_ppe: '', applies_to: '', file_url: '', last_updated: new Date().toISOString().slice(0, 10) };

export default function SikkerhedApv() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => { setItems(await base44.entities.SafetyProtocol.list('-created_date', 200).catch(() => [])); }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };

  const save = async () => {
    if (!form.title) { alert('Indtast titel'); return; }
    if (editing) await base44.entities.SafetyProtocol.update(editing.id, form);
    else await base44.entities.SafetyProtocol.create(form);
    setOpen(false); load();
  };
  const remove = async (id) => { if (confirm('Slet protokol?')) { await base44.entities.SafetyProtocol.delete(id); load(); } };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sikkerhed og APV</h1>
          <p className="text-sm text-muted-foreground">Sikkerhedsprocedurer og arbejdspladsvurderinger (APV).</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny protokol</Button>
      </div>

      <div className="grid gap-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Ingen protokoller.</p>}
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-slate-500" /></div>
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-xs text-muted-foreground">{it.category} {it.applies_to ? `• ${it.applies_to}` : ''} • Opdateret: {it.last_updated || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${RISK[it.risk_level]}`}>{it.risk_level}</span>
                <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            {it.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{it.content}</p>}
            {it.required_ppe && <div className="text-xs text-muted-foreground">Værneudstyr: {it.required_ppe}</div>}
            {it.file_url && <a href={it.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">Vis rapport</a>}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger protokol' : 'Ny sikkerhedsprotokol / APV'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Titel</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Kategori</Label><Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Risikoniveau</Label><Select value={form.risk_level} onValueChange={(v) => setForm((f) => ({ ...f, risk_level: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(RISK).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Gælder for</Label><Input value={form.applies_to} onChange={(e) => setForm((f) => ({ ...f, applies_to: e.target.value }))} placeholder="Alle / gravemaskineførere ..." /></div>
            <div><Label>Sidst opdateret</Label><Input type="date" value={form.last_updated} onChange={(e) => setForm((f) => ({ ...f, last_updated: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Påkrævet værnemiddel</Label><Input value={form.required_ppe} onChange={(e) => setForm((f) => ({ ...f, required_ppe: e.target.value }))} placeholder="Hjelm, høreværn ..." /></div>
            <div className="col-span-2"><Label>Indhold / beskrivelse</Label><Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} /></div>
            <div className="col-span-2"><Label>Rapport-fil (URL)</Label><Input value={form.file_url} onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))} placeholder="https://..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}