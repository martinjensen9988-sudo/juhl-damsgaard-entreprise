import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import { Plus, Pencil, Trash2, Search, Eye, ThumbsUp, BookOpen, FolderOpen, Download, X } from 'lucide-react';

const CATEGORIES = ['FAQ', 'Vejledning', 'Arbejdsprocedure', 'Sikkerhed', 'Teknik', 'Andet'];
const STATUSES = ['Udkast', 'Offentliggjort', 'Arkiveret'];

const catBadge = {
  'FAQ': 'bg-blue-100 text-blue-700',
  'Vejledning': 'bg-violet-100 text-violet-700',
  'Arbejdsprocedure': 'bg-amber-100 text-amber-700',
  'Sikkerhed': 'bg-red-100 text-red-700',
  'Teknik': 'bg-emerald-100 text-emerald-700',
  'Andet': 'bg-slate-100 text-slate-700',
};

const mdClass = "text-sm text-slate-700 space-y-3 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-xs";

const RES_CATEGORIES = ['Personalehåndbog', 'Firma-politik', 'Sikkerhedsinstruks', 'Procedure', 'Skabelon', 'Andet'];
const RES_BADGE = {
  'Personalehåndbog': 'bg-blue-100 text-blue-700',
  'Firma-politik': 'bg-purple-100 text-purple-700',
  'Sikkerhedsinstruks': 'bg-red-100 text-red-700',
  'Procedure': 'bg-amber-100 text-amber-700',
  'Skabelon': 'bg-emerald-100 text-emerald-700',
  'Andet': 'bg-slate-100 text-slate-600',
};
const ACCESS_BADGE = { 'Alle': 'bg-slate-100 text-slate-600', 'Ledelse': 'bg-purple-100 text-purple-700', 'Admin': 'bg-red-100 text-red-700' };
const emptyResource = { title: '', category: 'Procedure', description: '', file_url: '', file_name: '', version: '', access_level: 'Alle', uploaded_by: '' };

const emptyArticle = {
  title: '', category: 'FAQ', content: '', tags: '', author: '',
  status: 'Offentliggjort', views: 0, helpful_count: 0,
};

export default function Vidensbase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyArticle);
  const [resources, setResources] = useState([]);
  const [resOpen, setResOpen] = useState(false);
  const [resEditing, setResEditing] = useState(null);
  const [resForm, setResForm] = useState(emptyResource);
  const [resSaving, setResSaving] = useState(false);

  const load = async () => {
    try {
      setArticles(await base44.entities.KnowledgeArticle.list('-updated_date'));
      setResources(await base44.entities.CompanyResource.list('-updated_date').catch(() => []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyArticle); setEditOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ ...emptyArticle, ...a }); setEditOpen(true); };

  const save = async () => {
    if (editing) await base44.entities.KnowledgeArticle.update(editing.id, form);
    else await base44.entities.KnowledgeArticle.create(form);
    setEditOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Slet denne artikel?')) return;
    await base44.entities.KnowledgeArticle.delete(id);
    load();
  };

  const view = async (a) => {
    setViewing(a);
    setViewOpen(true);
    await base44.entities.KnowledgeArticle.update(a.id, { views: (a.views || 0) + 1 });
    load();
  };

  const markHelpful = async (a) => {
    await base44.entities.KnowledgeArticle.update(a.id, { helpful_count: (a.helpful_count || 0) + 1 });
    setViewing({ ...a, helpful_count: (a.helpful_count || 0) + 1 });
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openResCreate = () => { setResEditing(null); setResForm(emptyResource); setResOpen(true); };
  const openResEdit = (r) => { setResEditing(r); setResForm({ ...emptyResource, ...r }); setResOpen(true); };
  const setRes = (k, v) => setResForm((f) => ({ ...f, [k]: v }));
  const handleFile = async (file) => {
    if (!file) return;
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setResForm((f) => ({ ...f, file_url, file_name: file.name })); }
    catch (e) { alert('Upload fejlede'); }
  };
  const saveRes = async () => {
    if (!resForm.title) { alert('Angiv titel'); return; }
    setResSaving(true);
    try { if (resEditing) await base44.entities.CompanyResource.update(resEditing.id, resForm); else await base44.entities.CompanyResource.create(resForm); setResOpen(false); load(); }
    catch (e) { alert('Fejl ved lagring'); } setResSaving(false);
  };
  const removeRes = async (r) => { if (confirm(`Slet "${r.title}"?`)) { await base44.entities.CompanyResource.delete(r.id); load(); } };

  const filtered = articles.filter((a) => {
    if (filterCat !== 'all' && a.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q) || a.tags?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vidensbase</h1>
          <p className="text-sm text-slate-500 mt-1">Interne vejledninger, FAQ og arbejdsprocedurer</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Ny artikel</Button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg i artikler..." className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${catBadge[a.category] || catBadge['Andet']}`}>{a.category}</span>
                {a.status !== 'Offentliggjort' && <span className="text-xs text-slate-400">{a.status}</span>}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{a.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-3 whitespace-pre-line">{a.content}</p>
              {a.tags && <div className="mt-3 text-xs text-slate-400">🏷 {a.tags}</div>}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {a.views || 0}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {a.helpful_count || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => view(a)} className="text-slate-600 hover:text-slate-900">Læs</button>
                <button onClick={() => openEdit(a)} className="text-slate-600 hover:text-slate-900"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{articles.length === 0 ? 'Ingen artikler endnu' : 'Ingen resultater matcher din søgning'}</p>
        </div>
      )}

      {/* Company Resources / Files section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-amber-600" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Firmaressourcer & Filer</h2>
              <p className="text-sm text-slate-500">Personalehåndbøger, politikker, sikkerhedsinstrukser og skabeloner</p>
            </div>
          </div>
          <Button onClick={openResCreate} variant="outline"><Plus className="w-4 h-4" /> Tilføj dokument</Button>
        </div>
        {resources.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200"><FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">Ingen dokumenter uploadet endnu</p></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RES_BADGE[r.category] || RES_BADGE['Andet']}`}>{r.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACCESS_BADGE[r.access_level] || ACCESS_BADGE['Alle']}`}>🔒 {r.access_level}</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{r.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-2">{r.description || '—'}</p>
                {r.file_name && <div className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Download className="w-3 h-3" /> {r.file_name}</div>}
                <div className="flex gap-2 border-t border-slate-100 pt-2">
                  {r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-amber-600 hover:underline"><Download className="w-3 h-3" /> Åbn fil</a>}
                  <button onClick={() => openResEdit(r)} className="ml-auto text-slate-500 hover:text-slate-900"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeRes(r)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${catBadge[viewing?.category] || catBadge['Andet']}`}>{viewing?.category}</span>
            </div>
            <DialogTitle>{viewing?.title}</DialogTitle>
          </DialogHeader>
          {viewing?.author && <div className="text-sm text-slate-500 mb-3">Af {viewing.author}</div>}
          <div className={mdClass}>
            <ReactMarkdown>{viewing?.content || ''}</ReactMarkdown>
          </div>
          {viewing?.tags && <div className="mt-4 text-xs text-slate-400">🏷 {viewing.tags}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => markHelpful(viewing)} className="gap-2"><ThumbsUp className="w-4 h-4" /> Hjalp ({viewing?.helpful_count || 0})</Button>
            <Button onClick={() => { setViewOpen(false); openEdit(viewing); }} variant="outline" className="gap-2"><Pencil className="w-4 h-4" /> Rediger</Button>
            <Button onClick={() => setViewOpen(false)}>Luk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger artikel' : 'Ny artikel'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Titel *</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Forfatter</Label>
              <Input value={form.author} onChange={(e) => set('author', e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Tags (kommasepareret)</Label>
              <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="sikkerhed, gravearbejde" />
            </div>
            <div className="col-span-2">
              <Label>Indhold (Markdown understøttet)</Label>
              <Textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={10} placeholder="Skriv artiklen her..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={!form.title}>Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resOpen} onOpenChange={setResOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FolderOpen className="w-5 h-5 text-amber-600" />{resEditing ? 'Rediger dokument' : 'Nyt dokument'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Titel *</Label><Input value={resForm.title} onChange={(e) => setRes('title', e.target.value)} /></div>
            <div><Label>Kategori</Label><Select value={resForm.category} onValueChange={(v) => setRes('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RES_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Beskrivelse</Label><Textarea value={resForm.description} onChange={(e) => setRes('description', e.target.value)} rows={2} /></div>
            <div><Label>Adgangsniveau</Label><Select value={resForm.access_level} onValueChange={(v) => setRes('access_level', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Alle">Alle</SelectItem><SelectItem value="Ledelse">Ledelse</SelectItem><SelectItem value="Admin">Admin</SelectItem></SelectContent></Select></div>
            <div><Label>Fil</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-700 file:font-medium" />
                {resForm.file_url && <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => setRes('file_url', '')} />}
              </div>
              {resForm.file_name && <p className="text-xs text-slate-500 mt-1">{resForm.file_name}</p>}
            </div>
            <div><Label>Uploadet af</Label><Input value={resForm.uploaded_by} onChange={(e) => setRes('uploaded_by', e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setResOpen(false)}>Annuller</Button><Button onClick={saveRes} disabled={resSaving}>{resSaving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}