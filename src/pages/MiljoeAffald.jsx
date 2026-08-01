import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Recycle, Plus, Pencil, Trash2, BadgeCheck } from 'lucide-react';

const WASTE_TYPES = ['Beton', 'Træ', 'Metal', 'Blandet', 'Farligt affald', 'Jord', 'Gips', 'Andet'];
const DISPOSAL = ['Genanvendelse', 'Forbrænding', 'Deponi', 'Farligt affald centrret', 'Andet'];
const today = new Date().toISOString().slice(0, 10);
const empty = { title: '', project_name: '', waste_type: 'Blandet', amount: 0, unit: 'ton', disposal_method: 'Genanvendelse', date: today, certified: false, certificate_number: '', reported_by: '', notes: '' };

export default function MiljoeAffald() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => { try { setLogs(await base44.entities.WasteLog.list('-date')); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ ...empty, ...l }); setDialogOpen(true); };
  const save = async () => { if (editing) await base44.entities.WasteLog.update(editing.id, form); else await base44.entities.WasteLog.create(form); setDialogOpen(false); load(); };
  const remove = async (id) => { if (!confirm('Slet post?')) return; await base44.entities.WasteLog.delete(id); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Miljø & Affald</h1><p className="text-sm text-slate-500 mt-1">Dokumentation af affaldssortering og miljøvenlig håndtering på byggepladsen</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Ny post</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {logs.map((l) => (
          <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Recycle className="w-5 h-5 text-emerald-600" /></div><div><div className="font-semibold text-slate-900">{l.title}</div><div className="text-xs text-slate-500">{formatDate(l.date)}</div></div></div>
              {l.certified && <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><BadgeCheck className="w-4 h-4" /> Cert.</span>}
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-slate-700">{l.waste_type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Mængde</span><span className="text-slate-700">{l.amount} {l.unit}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Håndtering</span><span className="text-slate-700">{l.disposal_method}</span></div>
              {l.project_name && <div className="flex justify-between"><span className="text-slate-500">Projekt</span><span className="text-slate-700 truncate ml-2">{l.project_name}</span></div>}
              {l.certificate_number && <div className="flex justify-between"><span className="text-slate-500">Cert.nr.</span><span className="text-slate-700">{l.certificate_number}</span></div>}
            </div>
            <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100"><button onClick={() => openEdit(l)} className="flex-1 text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1"><Pencil className="w-3.5 h-3.5" /> Rediger</button><button onClick={() => remove(l.id)} className="flex-1 text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1 border-l border-slate-100"><Trash2 className="w-3.5 h-3.5" /> Slet</button></div>
          </div>
        ))}
      </div>
      {logs.length === 0 && <div className="text-center py-16 text-slate-400"><Recycle className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Ingen affaldsposter registreret</p></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger post' : 'Ny affaldspost'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Titel *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div><Label>Affaldstype</Label><Select value={form.waste_type} onValueChange={(v) => set('waste_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{WASTE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Håndtering</Label><Select value={form.disposal_method} onValueChange={(v) => set('disposal_method', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DISPOSAL.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Mængde</Label><Input type="number" value={form.amount} onChange={(e) => set('amount', Number(e.target.value))} /></div>
            <div><Label>Enhed</Label><Input value={form.unit} onChange={(e) => set('unit', e.target.value)} /></div>
            <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
            <div><Label>Projekt</Label><Input value={form.project_name} onChange={(e) => set('project_name', e.target.value)} /></div>
            <div><Label>Certifikatnr.</Label><Input value={form.certificate_number} onChange={(e) => set('certificate_number', e.target.value)} /></div>
            <div><Label>Rapporteret af</Label><Input value={form.reported_by} onChange={(e) => set('reported_by', e.target.value)} /></div>
            <div className="col-span-2 flex items-center gap-2"><input type="checkbox" id="cert" checked={form.certified} onChange={(e) => set('certified', e.target.checked)} className="w-4 h-4" /><Label htmlFor="cert" className="cursor-pointer">Certificeret håndtering</Label></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.title}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}