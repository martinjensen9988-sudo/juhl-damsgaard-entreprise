import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search, FolderOpen, Download, X } from 'lucide-react';

const categoryColors = {
  Personalehåndbog: 'bg-blue-100 text-blue-700',
  'Firma-politik': 'bg-purple-100 text-purple-700',
  Sikkerhedsinstruks: 'bg-red-100 text-red-700',
  Procedure: 'bg-amber-100 text-amber-700',
  Skabelon: 'bg-emerald-100 text-emerald-700',
  Andet: 'bg-slate-100 text-slate-600',
};

const empty = { title: '', category: 'Procedure', description: '', file_url: '', file_name: '', version: '', last_updated: '', access_level: 'Alle', uploaded_by: '' };

export default function VidensbaseFiler() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { setItems(await base44.entities.CompanyResource.list() || []); } catch(e){console.error(e);} setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => (!search || i.title?.toLowerCase().includes(search.toLowerCase())) && (catFilter === 'all' || i.category === catFilter));

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({...empty, ...i}); setDialogOpen(true); };
  const field = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleFile = async (file) => {
    if (!file) return;
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm(f => ({...f, file_url, file_name: file.name})); }
    catch(e){ alert('Upload fejlede'); }
  };

  const save = async () => {
    if (!form.title) { alert('Angiv titel'); return; }
    setSaving(true);
    try { if (editing) await base44.entities.CompanyResource.update(editing.id, form); else await base44.entities.CompanyResource.create(form); setDialogOpen(false); load(); }
    catch(e){ alert('Fejl ved lagring'); } setSaving(false);
  };

  const remove = async (i) => { if (confirm(`Slet "${i.title}"?`)) { try { await base44.entities.CompanyResource.delete(i.id); load(); } catch(e){} } };

  const stats = { total: items.length, handbook: items.filter(i=>i.category==='Personalehåndbog').length, policy: items.filter(i=>i.category==='Firma-politik').length, safety: items.filter(i=>i.category==='Sikkerhedsinstruks').length };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-amber-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Firmaressourcer</h1><p className="text-slate-500 mt-0.5">Interne dokumenter, politikker og vejledninger</p></div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj dokument</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{l:'Total',v:stats.total,c:'text-slate-900'},{l:'Håndbøger',v:stats.handbook,c:'text-blue-600'},{l:'Politikker',v:stats.policy,c:'text-purple-600'},{l:'Sikkerhed',v:stats.safety,c:'text-red-600'}].map(s => (
          <div key={s.l} className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">{s.l}</div><div className={`text-2xl font-bold ${s.c}`}>{s.v}</div></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Søg..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={catFilter} onValueChange={setCatFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle kategorier</SelectItem>{Object.keys(categoryColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen dokumenter fundet</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(i => (
            <div key={i.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-2 mb-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[i.category]||categoryColors.Andet}`}>{i.category}</span>{i.access_level !== 'Alle' && <span className="text-xs text-slate-400">{i.access_level}</span>}</div>
              <h3 className="font-semibold text-slate-900 mb-1">{i.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-3">{i.description || '—'}</p>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span>v{i.version || '1.0'}</span>{i.last_updated && <span>Opd. {formatDate(i.last_updated)}</span>}
              </div>
              <div className="flex gap-2 border-t border-slate-100 pt-3">
                {i.file_url && <a href={i.file_url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition"><Download className="w-3.5 h-3.5" /> Åbn</a>}
                <button onClick={()=>openEdit(i)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={()=>remove(i)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FolderOpen className="w-5 h-5 text-amber-600" />{editing ? 'Rediger dokument' : 'Nyt dokument'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Titel *</Label><Input value={form.title} onChange={e=>field('title',e.target.value)} /></div>
            <div><Label>Kategori</Label><Select value={form.category} onValueChange={v=>field('category',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(categoryColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Beskrivelse</Label><Textarea value={form.description} onChange={e=>field('description',e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Version</Label><Input value={form.version} onChange={e=>field('version',e.target.value)} placeholder="1.0" /></div>
              <div><Label>Sidst opdateret</Label><Input type="date" value={form.last_updated} onChange={e=>field('last_updated',e.target.value)} /></div>
            </div>
            <div><Label>Adgangsniveau</Label><Select value={form.access_level} onValueChange={v=>field('access_level',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Alle">Alle</SelectItem><SelectItem value="Ledelse">Ledelse</SelectItem><SelectItem value="Admin">Admin</SelectItem></SelectContent></Select></div>
            <div><Label>Fil</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])} className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-700 file:font-medium" />
                {form.file_url && <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={()=>field('file_url','')} />}
              </div>
              {form.file_name && <p className="text-xs text-slate-500 mt-1">{form.file_name}</p>}
            </div>
            <div><Label>Uploadet af</Label><Input value={form.uploaded_by} onChange={e=>field('uploaded_by',e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving?'Gemmer...':'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}