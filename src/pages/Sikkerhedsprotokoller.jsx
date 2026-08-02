import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search, ShieldAlert, Download, HardHat, AlertTriangle } from 'lucide-react';

const riskColors = { Lav: 'bg-emerald-100 text-emerald-700', Mellem: 'bg-amber-100 text-amber-700', Høj: 'bg-orange-100 text-orange-700', Kritisk: 'bg-red-100 text-red-700' };
const catColors = { Arbejdsmiljø: 'bg-blue-100 text-blue-700', Sikkerhedsprotokol: 'bg-red-100 text-red-700', Vejledning: 'bg-amber-100 text-amber-700', Riskikovurdering: 'bg-purple-100 text-purple-700', Værneudstyr: 'bg-emerald-100 text-emerald-700', Andet: 'bg-slate-100 text-slate-600' };
const empty = { title: '', category: 'Sikkerhedsprotokol', risk_level: 'Mellem', content: '', required_ppe: '', applies_to: '', file_url: '', last_updated: '', created_by: '' };

export default function Sikkerhedsprotokoller() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { setItems(await base44.entities.SafetyProtocol.list() || []); } catch(e){console.error(e);} setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => (!search || i.title?.toLowerCase().includes(search.toLowerCase())) && (catFilter === 'all' || i.category === catFilter));

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({...empty, ...i}); setDialogOpen(true); };
  const field = (k, v) => setForm(f => ({...f, [k]: v}));

  const save = async () => {
    if (!form.title) { alert('Angiv titel'); return; }
    setSaving(true);
    try { if (editing) await base44.entities.SafetyProtocol.update(editing.id, form); else await base44.entities.SafetyProtocol.create(form); setDialogOpen(false); load(); }
    catch(e){ alert('Fejl'); } setSaving(false);
  };

  const remove = async (i) => { if (confirm(`Slet "${i.title}"?`)) { try { await base44.entities.SafetyProtocol.delete(i.id); load(); } catch(e){} } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-red-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Sikkerhedsprotokoller</h1><p className="text-slate-500 mt-0.5">Arbejdsmiljøvejledninger og sikkerhedsinstrukser</p></div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Ny protokol</Button>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>Læs altid relevante protokoller før du påbegynder risikofyldte opgaver. Kontakt sikkerhedsansvarlig ved tvivl.</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Søg..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={catFilter} onValueChange={setCatFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle kategorier</SelectItem>{Object.keys(catColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen protokoller fundet</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(i => (
            <div key={i.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${catColors[i.category]||catColors.Andet}`}>{i.category}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${riskColors[i.risk_level]||riskColors.Mellem}`}>{i.risk_level} risiko</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{i.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-3 mb-3">{i.content}</p>
              {i.required_ppe && <div className="text-xs text-slate-400 mb-2"><HardHat className="w-3.5 h-3.5 inline mr-1" />{i.required_ppe}</div>}
              {i.applies_to && <div className="text-xs text-slate-400 mb-3">Gælder: {i.applies_to}</div>}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">{i.last_updated && <span>Opd. {formatDate(i.last_updated)}</span>}</div>
              <div className="flex gap-2 border-t border-slate-100 pt-3">
                {i.file_url && <a href={i.file_url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition"><Download className="w-3.5 h-3.5" /> Åbn fil</a>}
                <button onClick={()=>openEdit(i)} className="flex items-center justify-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={()=>remove(i)} className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-600" />{editing ? 'Rediger protokol' : 'Ny protokol'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Titel *</Label><Input value={form.title} onChange={e=>field('title',e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kategori</Label><Select value={form.category} onValueChange={v=>field('category',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(catColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Risikoniveau</Label><Select value={form.risk_level} onValueChange={v=>field('risk_level',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(riskColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Indhold / vejledning</Label><Textarea value={form.content} onChange={e=>field('content',e.target.value)} rows={5} /></div>
            <div><Label>Påkrævet værnemiddel (PPE)</Label><Input value={form.required_ppe} onChange={e=>field('required_ppe',e.target.value)} placeholder="f.eks. hjelm, høreværn, støvler" /></div>
            <div><Label>Gælder for</Label><Input value={form.applies_to} onChange={e=>field('applies_to',e.target.value)} placeholder="f.eks. gravearbejde, asfaltering" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sidst opdateret</Label><Input type="date" value={form.last_updated} onChange={e=>field('last_updated',e.target.value)} /></div>
              <div><Label>Oprettet af</Label><Input value={form.created_by} onChange={e=>field('created_by',e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving?'Gemmer...':'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}