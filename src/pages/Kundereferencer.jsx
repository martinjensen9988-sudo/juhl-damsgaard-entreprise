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
import { Plus, Pencil, Trash2, Search, Star, Upload, X, MapPin, Camera } from 'lucide-react';

const typeColors = { Gravearbejde: 'bg-amber-100 text-amber-700', Kloak: 'bg-blue-100 text-blue-700', Asfalt: 'bg-slate-100 text-slate-700', Beton: 'bg-gray-100 text-gray-700', Nedrivning: 'bg-red-100 text-red-700', Anlæg: 'bg-emerald-100 text-emerald-700', Andet: 'bg-purple-100 text-purple-700' };
const empty = { title: '', customer_name: '', project_name: '', project_type: 'Anlæg', description: '', main_photo_url: '', photo_urls: [], completed_date: '', location: '', featured: false, rating: 5 };

export default function Kundereferencer() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { setItems(await base44.entities.CustomerReference.list() || []); } catch(e){console.error(e);} setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.customer_name?.toLowerCase().includes(search.toLowerCase()) || i.project_name?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({...empty, ...i, photo_urls: i.photo_urls || []}); setDialogOpen(true); };
  const field = (k, v) => setForm(f => ({...f, [k]: v}));

  const handlePhoto = async (key) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm(f => ({...f, [key]: file_url})); }
      catch(e){ alert('Upload fejlede'); }
    };
    input.click();
  };

  const save = async () => {
    if (!form.title) { alert('Angiv titel'); return; }
    setSaving(true);
    try { if (editing) await base44.entities.CustomerReference.update(editing.id, form); else await base44.entities.CustomerReference.create(form); setDialogOpen(false); load(); }
    catch(e){ alert('Fejl'); } setSaving(false);
  };

  const remove = async (i) => { if (confirm(`Slet "${i.title}"?`)) { try { await base44.entities.CustomerReference.delete(i.id); load(); } catch(e){} } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Star className="w-5 h-5 text-amber-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kundereferencer</h1><p className="text-slate-500 mt-0.5">Afsluttede projekter til brug som referencemateriale</p></div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj reference</Button>
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Søg på titel, kunde, projekt..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Star className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen referencer fundet</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(i => (
            <div key={i.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition group">
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                {i.main_photo_url ? (
                  <Image src={i.main_photo_url} alt={i.title} className="w-full h-full" fittingType="fill" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera className="w-10 h-10" /></div>
                )}
                {i.featured && <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-medium flex items-center gap-1"><Star className="w-3 h-3 fill-slate-950" /> Fremhævet</span>}
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[i.project_type]||typeColors.Andet}`}>{i.project_type}</span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900 mb-1">{i.title}</h3>
                {i.customer_name && <p className="text-sm text-slate-600 mb-1">{i.customer_name}</p>}
                {i.location && <p className="text-xs text-slate-400 flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" /> {i.location}</p>}
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{i.description}</p>
                <div className="flex items-center justify-between">
                  {i.rating && <div className="flex gap-0.5">{Array.from({length:5}).map((_,idx)=><Star key={idx} className={`w-3.5 h-3.5 ${idx<i.rating?'fill-amber-400 text-amber-400':'text-slate-200'}`} />)}</div>}
                  {i.completed_date && <span className="text-xs text-slate-400">{formatDate(i.completed_date)}</span>}
                </div>
                <div className="flex gap-2 mt-4 border-t border-slate-100 pt-3">
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-600" />{editing ? 'Rediger reference' : 'Ny reference'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Titel *</Label><Input value={form.title} onChange={e=>field('title',e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kunde</Label><Input value={form.customer_name} onChange={e=>field('customer_name',e.target.value)} /></div>
              <div><Label>Projektnavn</Label><Input value={form.project_name} onChange={e=>field('project_name',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={form.project_type} onValueChange={v=>field('project_type',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(typeColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Afsluttet</Label><Input type="date" value={form.completed_date} onChange={e=>field('completed_date',e.target.value)} /></div>
            </div>
            <div><Label>Lokation</Label><Input value={form.location} onChange={e=>field('location',e.target.value)} /></div>
            <div><Label>Beskrivelse</Label><Textarea value={form.description} onChange={e=>field('description',e.target.value)} rows={3} /></div>
            <div><Label>Hovedbillede</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={()=>handlePhoto('main_photo_url')}><Upload className="w-4 h-4" /> Upload billede</Button>
                {form.main_photo_url && <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={()=>field('main_photo_url','')} />}
              </div>
              {form.main_photo_url && <img src={form.main_photo_url} alt="" className="mt-2 w-full h-32 object-cover rounded-lg" />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kundevurdering (1-5)</Label><Input type="number" min="1" max="5" value={form.rating} onChange={e=>field('rating',Number(e.target.value))} /></div>
              <div><Label>Fremhævet</Label><Select value={form.featured?'true':'false'} onValueChange={v=>field('featured',v==='true')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">Nej</SelectItem><SelectItem value="true">Ja</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving?'Gemmer...':'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}