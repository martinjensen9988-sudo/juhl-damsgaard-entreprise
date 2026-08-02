import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDKK, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search, TrendingDown, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const catColors = { Materialer: '#f59e0b', Maskiner: '#3b82f6', Transport: '#8b5cf6', Lønninger: '#10b981', Brændstof: '#ef4444', Forsikring: '#ec4899', Værktøj: '#14b8a6', ' Kontor': '#6366f1', Markedsføring: '#f97316', Andet: '#94a3b8' };
const empty = { title: '', category: 'Materialer', amount: '', date: '', project_id: '', project_name: '', supplier_name: '', recurring: false, notes: '' };

export default function UdgiftsOversigt() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const [d, p] = await Promise.all([base44.entities.Expense.list('-date'), base44.entities.Project.list().catch(()=>[])]); setItems(d||[]); setProjects(p||[]); } catch(e){console.error(e);} setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => (!search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.supplier_name?.toLowerCase().includes(search.toLowerCase())) && (catFilter === 'all' || i.category === catFilter));

  const openCreate = () => { setEditing(null); setForm({...empty, date: new Date().toISOString().split('T')[0]}); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({...empty, ...i}); setDialogOpen(true); };
  const field = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleProject = (id) => { const p = projects.find(x=>x.id===id); setForm(f => ({...f, project_id: id, project_name: p?.name||''})); };

  const save = async () => {
    if (!form.title || !form.amount || !form.date) { alert('Udfyld titel, beløb og dato'); return; }
    setSaving(true);
    try { const payload = {...form, amount: Number(form.amount)||0}; if (editing) await base44.entities.Expense.update(editing.id, payload); else await base44.entities.Expense.create(payload); setDialogOpen(false); load(); }
    catch(e){ alert('Fejl'); } setSaving(false);
  };

  const remove = async (i) => { if (confirm(`Slet "${i.title}"?`)) { try { await base44.entities.Expense.delete(i.id); load(); } catch(e){} } };

  const total = filtered.reduce((s,i)=>s+(i.amount||0),0);
  const byCategory = Object.entries(catColors).map(([cat, color]) => ({ name: cat, value: filtered.filter(i=>i.category===cat).reduce((s,i)=>s+(i.amount||0),0), color })).filter(d=>d.value>0);
  const byProject = {};
  filtered.forEach(i => { const k = i.project_name || 'Uden projekt'; byProject[k] = (byProject[k]||0) + (i.amount||0); });
  const projectData = Object.entries(byProject).map(([name, value]) => ({ name, amount: value })).sort((a,b)=>b.amount-a.amount).slice(0,8);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-amber-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Udgiftsoversigt</h1><p className="text-slate-500 mt-0.5">Alle firmaets omkostninger fordelt på kategorier og projekter</p></div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj udgift</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Total udgifter</div><div className="text-2xl font-bold text-slate-900">{formatDKK(total)}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Antal poster</div><div className="text-2xl font-bold text-slate-900">{filtered.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Største kategori</div><div className="text-lg font-bold text-slate-900 truncate">{byCategory.sort((a,b)=>b.value-a.value)[0]?.name || '—'}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Tilbagevendende</div><div className="text-2xl font-bold text-slate-900">{items.filter(i=>i.recurring).length}</div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {byCategory.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><PieIcon className="w-5 h-5 text-amber-600" /> Fordeling på kategorier</h3>
            <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>{byCategory.map((e,i)=><Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={(v)=>formatDKK(v)} /></PieChart></ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-3">{byCategory.map(c=><div key={c.name} className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full" style={{background:c.color}} /><span className="text-slate-600">{c.name}</span><span className="text-slate-400 ml-auto">{formatDKK(c.value)}</span></div>)}</div>
          </div>
        )}
        {projectData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Top projekter</h3>
            <ResponsiveContainer width="100%" height={250}><BarChart data={projectData} layout="vertical" margin={{left: 80}}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(v)=>`${(v/1000).toFixed(0)}k`} /><YAxis type="category" dataKey="name" width={80} tick={{fontSize:12}} /><Tooltip formatter={(v)=>formatDKK(v)} /><Bar dataKey="amount" fill="#f59e0b" radius={[0,4,4,0]} /></BarChart></ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Søg..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={catFilter} onValueChange={setCatFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle kategorier</SelectItem>{Object.keys(catColors).map(c=><SelectItem key={c} value={c}>{c.trim()}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen udgifter registreret</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map(i => (
              <div key={i.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{background: catColors[i.category]||'#94a3b8'}} />
                <div className="flex-1 min-w-0"><h3 className="font-medium text-slate-900 truncate">{i.title}</h3><div className="text-sm text-slate-500">{i.category.trim()}{i.project_name && ` · ${i.project_name}`}{i.supplier_name && ` · ${i.supplier_name}`}{i.recurring && ' · Tilbagevendende'}</div></div>
                <div className="text-right hidden sm:block"><div className="text-xs text-slate-400">{formatDate(i.date)}</div></div>
                <div className="font-semibold text-slate-900">{formatDKK(i.amount)}</div>
                <div className="flex gap-1"><button onClick={()=>openEdit(i)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button><button onClick={()=>remove(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingDown className="w-5 h-5 text-amber-600" />{editing ? 'Rediger udgift' : 'Ny udgift'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Titel *</Label><Input value={form.title} onChange={e=>field('title',e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kategori</Label><Select value={form.category} onValueChange={v=>field('category',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(catColors).map(c=><SelectItem key={c} value={c}>{c.trim()}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Beløb (DKK) *</Label><Input type="number" value={form.amount} onChange={e=>field('amount',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Dato *</Label><Input type="date" value={form.date} onChange={e=>field('date',e.target.value)} /></div>
              <div><Label>Leverandør</Label><Input value={form.supplier_name} onChange={e=>field('supplier_name',e.target.value)} /></div>
            </div>
            <div><Label>Projekt</Label><Select value={form.project_id} onValueChange={handleProject}><SelectTrigger><SelectValue placeholder="Ingen projekt" /></SelectTrigger><SelectContent><SelectItem value={null}>Ingen projekt</SelectItem>{projects.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Tilbagevendende</Label><Select value={form.recurring?'true':'false'} onValueChange={v=>field('recurring',v==='true')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">Nej</SelectItem><SelectItem value="true">Ja</SelectItem></SelectContent></Select></div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={e=>field('notes',e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving?'Gemmer...':'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}