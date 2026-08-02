import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search, Camera, Images, Upload, X, MapPin } from 'lucide-react';

const catColors = { 'Før/Efter': 'bg-amber-100 text-amber-700', Byggeplads: 'bg-blue-100 text-blue-700', Færdigt: 'bg-emerald-100 text-emerald-700', Problem: 'bg-red-100 text-red-700', Andet: 'bg-slate-100 text-slate-600' };
const empty = { title: '', project_id: '', project_name: '', description: '', before_photo_url: '', after_photo_url: '', photo_urls: [], category: 'Før/Efter', uploaded_by: '', date: new Date().toISOString().split('T')[0] };

export default function Billedarkiv() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const [d, p] = await Promise.all([base44.entities.PhotoArchive.list('-date'), base44.entities.Project.list().catch(()=>[])]); setItems(d||[]); setProjects(p||[]); } catch(e){console.error(e);} setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => (!search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.project_name?.toLowerCase().includes(search.toLowerCase())) && (catFilter === 'all' || i.category === catFilter));

  const openCreate = () => { setEditing(null); setForm({...empty, date: new Date().toISOString().split('T')[0]}); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({...empty, ...i, photo_urls: i.photo_urls || []}); setDialogOpen(true); };
  const field = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleProject = (id) => { const p = projects.find(x=>x.id===id); setForm(f=>({...f, project_id: id, project_name: p?.name||''})); };

  const handlePhoto = async (key) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => { const file = e.target.files[0]; if (!file) return; try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm(f => ({...f, [key]: file_url})); } catch(err){ alert('Upload fejlede'); } };
    input.click();
  };

  const save = async () => {
    if (!form.title) { alert('Angiv titel'); return; }
    setSaving(true);
    try { if (editing) await base44.entities.PhotoArchive.update(editing.id, form); else await base44.entities.PhotoArchive.create(form); setDialogOpen(false); load(); }
    catch(e){ alert('Fejl'); } setSaving(false);
  };

  const remove = async (i) => { if (confirm(`Slet "${i.title}"?`)) { try { await base44.entities.PhotoArchive.delete(i.id); load(); } catch(e){} } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Images className="w-5 h-5 text-amber-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Billedarkiv</h1><p className="text-slate-500 mt-0.5">Fælles galleri med før- og efterbilleder fra byggepladser</p></div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Upload billeder</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Søg..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={catFilter} onValueChange={setCatFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle kategorier</SelectItem>{Object.keys(catColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Images className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen billeder uploadet</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(i => (
            <div key={i.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition group">
              <div className="grid grid-cols-2 h-48">
                <div className="relative bg-slate-100 overflow-hidden">
                  {i.before_photo_url ? <Image src={i.before_photo_url} alt="Før" className="w-full h-full" fittingType="fill" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><Camera className="w-8 h-8" /><span className="text-xs mt-1">Før</span></div>}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">Før</span>
                </div>
                <div className="relative bg-slate-100 overflow-hidden">
                  {i.after_photo_url ? <Image src={i.after_photo_url} alt="Efter" className="w-full h-full" fittingType="fill" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><Camera className="w-8 h-8" /><span className="text-xs mt-1">Efter</span></div>}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs">Efter</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2"><h3 className="font-semibold text-slate-900">{i.title}</h3><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColors[i.category]||catColors.Andet}`}>{i.category}</span></div>
                {i.project_name && <p className="text-sm text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {i.project_name}</p>}
                {i.description && <p className="text-sm text-slate-500 line-clamp-2 mb-2">{i.description}</p>}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">{i.uploaded_by && <span>{i.uploaded_by}</span>}{i.date && <span>{formatDate(i.date)}</span>}</div>
                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button onClick={()=>openEdit(i)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /> Rediger</button>
                  <button onClick={()=>remove(i)} className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Images className="w-5 h-5 text-amber-600" />{editing ? 'Rediger billedesæt' : 'Upload billeder'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Titel *</Label><Input value={form.title} onChange={e=>field('title',e.target.value)} /></div>
            <div><Label>Projekt</Label><Select value={form.project_id} onValueChange={handleProject}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent><SelectItem value={null}>Ingen projekt</SelectItem>{projects.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Kategori</Label><Select value={form.category} onValueChange={v=>field('category',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(catColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Beskrivelse</Label><Textarea value={form.description} onChange={e=>field('description',e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Før-billede</Label><div className="flex items-center gap-2"><Button variant="outline" onClick={()=>handlePhoto('before_photo_url')}><Upload className="w-4 h-4" /> Upload</Button>{form.before_photo_url && <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={()=>field('before_photo_url','')} />}</div>{form.before_photo_url && <img src={form.before_photo_url} alt="" className="mt-2 w-full h-24 object-cover rounded-lg" />}</div>
              <div><Label>Efter-billede</Label><div className="flex items-center gap-2"><Button variant="outline" onClick={()=>handlePhoto('after_photo_url')}><Upload className="w-4 h-4" /> Upload</Button>{form.after_photo_url && <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={()=>field('after_photo_url','')} />}</div>{form.after_photo_url && <img src={form.after_photo_url} alt="" className="mt-2 w-full h-24 object-cover rounded-lg" />}</div>
            </div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Uploadet af</Label><Input value={form.uploaded_by} onChange={e=>field('uploaded_by',e.target.value)} /></div><div><Label>Dato</Label><Input type="date" value={form.date} onChange={e=>field('date',e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving?'Gemmer...':'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}