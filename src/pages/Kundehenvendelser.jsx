import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search, Inbox, Mail, Phone, ArrowRight, Building2, TrendingUp, FileText, Receipt } from 'lucide-react';

const dkk = (n) => new Intl.NumberFormat('da-DK',{style:'currency',currency:'DKK',maximumFractionDigits:0}).format(Number(n)||0);

const typeColors = { Gravearbejde: 'bg-amber-100 text-amber-700', Kloak: 'bg-blue-100 text-blue-700', Asfalt: 'bg-slate-100 text-slate-700', Beton: 'bg-gray-100 text-gray-700', Nedrivning: 'bg-red-100 text-red-700', Anlæg: 'bg-emerald-100 text-emerald-700', Andet: 'bg-purple-100 text-purple-700' };
const statusColors = { Ny: 'bg-amber-100 text-amber-700', Kontaktet: 'bg-blue-100 text-blue-700', 'Tilbud sendt': 'bg-purple-100 text-purple-700', Konverteret: 'bg-emerald-100 text-emerald-700', Tabt: 'bg-slate-100 text-slate-600' };
const sourceColors = { 'Forside kontakt': 'bg-slate-100 text-slate-600', Prisberegner: 'bg-amber-100 text-amber-700', 'AI tilbudschat': 'bg-purple-100 text-purple-700', Telefon: 'bg-blue-100 text-blue-700', Andet: 'bg-gray-100 text-gray-600' };
const empty = { name: '', email: '', phone: '', project_type: 'Andet', description: '', estimated_budget: '', address: '', source: 'Forside kontakt', status: 'Ny', submitted_date: new Date().toISOString().split('T')[0], notes: '', request_summary: '', line_items: [], quote_total: '' };

export default function Kundehenvendelser() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { setItems(await base44.entities.WebsiteInquiry.list('-submitted_date') || []); } catch(e){console.error(e);} setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => (!search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.email?.toLowerCase().includes(search.toLowerCase())) && (statusFilter === 'all' || i.status === statusFilter));

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({...empty, ...i}); setDialogOpen(true); };
  const field = (k, v) => setForm(f => ({...f, [k]: v}));

  const save = async () => {
    if (!form.name || !form.email) { alert('Angiv navn og email'); return; }
    setSaving(true);
    try { const payload = {...form, estimated_budget: Number(form.estimated_budget)||0, quote_total: form.quote_total === '' ? 0 : Number(form.quote_total)||0, line_items: (form.line_items || []).map(li => ({ description: li.description || '', quantity: Number(li.quantity)||0, unit: li.unit || 'stk', unit_price: Number(li.unit_price)||0, line_total: Number(li.line_total)||(Number(li.quantity)||0)*(Number(li.unit_price)||0) }))}; if (editing) await base44.entities.WebsiteInquiry.update(editing.id, payload); else await base44.entities.WebsiteInquiry.create(payload); setDialogOpen(false); load(); }
    catch(e){ alert('Fejl'); } setSaving(false);
  };

  const convertToLead = async (i) => {
    try {
      await base44.entities.Lead.create({ name: i.name, customer_name: i.name, customer_email: i.email, customer_phone: i.phone, description: i.description, estimated_value: i.estimated_budget || 0, stage: 'Nyt lead', project_type: i.project_type, source: 'Hjemmeside' });
      await base44.entities.WebsiteInquiry.update(i.id, { status: 'Konverteret' });
      load();
      alert('Henvendelse konverteret til lead!');
    } catch(e){ alert('Fejl ved konvertering'); }
  };

  const remove = async (i) => { if (confirm(`Slet henvendelse fra ${i.name}?`)) { try { await base44.entities.WebsiteInquiry.delete(i.id); load(); } catch(e){} } };

  const stats = { total: items.length, new: items.filter(i=>i.status==='Ny').length, contacted: items.filter(i=>i.status==='Kontaktet').length, converted: items.filter(i=>i.status==='Konverteret').length };
  const conversionRate = stats.total > 0 ? Math.round(stats.converted/stats.total*100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Inbox className="w-5 h-5 text-amber-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kundehenvendelser</h1><p className="text-slate-500 mt-0.5">Indkomne forespørgsler fra hjemmesiden</p></div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj henvendelse</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Total</div><div className="text-2xl font-bold text-slate-900">{stats.total}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Nye</div><div className="text-2xl font-bold text-amber-600">{stats.new}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Konverteret</div><div className="text-2xl font-bold text-emerald-600">{stats.converted}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Konverteringsrate</div><div className="text-2xl font-bold text-slate-900">{conversionRate}%</div></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Søg på navn eller email..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle statusser</SelectItem>{Object.keys(statusColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen henvendelser fundet</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(i => (
            <div key={i.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sourceColors[i.source]||sourceColors.Andet}`}>{i.source}</span>
                  {i.project_type && <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[i.project_type]||typeColors.Andet}`}>{i.project_type}</span>}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[i.status]||statusColors.Ny}`}>{i.status}</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{i.name}</h3>
              <div className="space-y-1 text-sm text-slate-500 mb-3">
                {i.email && <a href={`mailto:${i.email}`} className="flex items-center gap-1.5 hover:text-amber-600"><Mail className="w-3.5 h-3.5" /> {i.email}</a>}
                {i.phone && <a href={`tel:${i.phone}`} className="flex items-center gap-1.5 hover:text-amber-600"><Phone className="w-3.5 h-3.5" /> {i.phone}</a>}
                {i.address && <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {i.address}</div>}
                {i.estimated_budget > 0 && <div className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Budget: {new Intl.NumberFormat('da-DK',{style:'currency',currency:'DKK',maximumFractionDigits:0}).format(i.estimated_budget)}</div>}
              </div>
              {i.request_summary && <div className="bg-slate-50 rounded-lg p-3 mb-3 text-xs text-slate-600 italic line-clamp-3">"{i.request_summary}"</div>}
              {i.line_items?.length > 0 && (
                <div className="bg-amber-50/50 rounded-lg border border-amber-100 p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Tilbudslinjer ({i.line_items.length})</span>
                    {i.quote_total > 0 && <span className="text-xs font-bold text-amber-700 flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> {dkk(i.quote_total)}</span>}
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {i.line_items.map((li, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-600">
                        <span className="flex-1 min-w-0 truncate">{li.description} <span className="text-slate-400">· {li.quantity} {li.unit} × {dkk(li.unit_price)}</span></span>
                        <span className="ml-2 font-medium">{dkk(li.line_total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {i.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{i.description}</p>}
              <div className="text-xs text-slate-400 mb-3">Indsendt: {formatDate(i.submitted_date)}</div>
              <div className="flex gap-2 border-t border-slate-100 pt-3">
                {i.status !== 'Konverteret' && <button onClick={()=>convertToLead(i)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition"><ArrowRight className="w-3.5 h-3.5" /> Konverter til lead</button>}
                <button onClick={()=>openEdit(i)} className="flex items-center justify-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={()=>remove(i)} className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Inbox className="w-5 h-5 text-amber-600" />{editing ? 'Rediger henvendelse' : 'Ny henvendelse'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3"><div><Label>Navn *</Label><Input value={form.name} onChange={e=>field('name',e.target.value)} /></div><div><Label>Email *</Label><Input value={form.email} onChange={e=>field('email',e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Telefon</Label><Input value={form.phone} onChange={e=>field('phone',e.target.value)} /></div><div><Label>Opgavetype</Label><Select value={form.project_type} onValueChange={v=>field('project_type',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(typeColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label>Beskrivelse</Label><Textarea value={form.description} onChange={e=>field('description',e.target.value)} rows={3} /></div>
            <div><Label>Kundens beskrivelse (AI)</Label><Textarea value={form.request_summary} onChange={e=>field('request_summary',e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Estimeret budget ekskl. moms (DKK)</Label><Input type="number" value={form.estimated_budget} onChange={e=>field('estimated_budget',e.target.value)} /></div><div><Label>Tilbud total inkl. moms (DKK)</Label><Input type="number" value={form.quote_total} onChange={e=>field('quote_total',e.target.value)} /></div></div>
            <div><Label>Kilde</Label><Select value={form.source} onValueChange={v=>field('source',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(sourceColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Tilbudslinjer</Label>
                <button type="button" onClick={()=>setForm(f=>({...f, line_items:[...(f.line_items||[]), {description:'', quantity:1, unit:'stk', unit_price:0, line_total:0}]}))} className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Tilføj linje</button>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(form.line_items||[]).map((li, idx)=>(
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center bg-slate-50 rounded-lg p-2">
                    <Input className="col-span-5 text-xs h-8" placeholder="Beskrivelse" value={li.description||''} onChange={e=>{const next=[...form.line_items]; next[idx]={...next[idx], description:e.target.value}; setForm(f=>({...f, line_items:next}));}} />
                    <Input className="col-span-2 text-xs h-8 text-right" type="number" placeholder="Antal" value={li.quantity??''} onChange={e=>{const q=Number(e.target.value)||0; const next=[...form.line_items]; next[idx]={...next[idx], quantity:q, line_total:q*(Number(next[idx].unit_price)||0)}; setForm(f=>({...f, line_items:next}));}} />
                    <Input className="col-span-2 text-xs h-8" placeholder="Enhed" value={li.unit||''} onChange={e=>{const next=[...form.line_items]; next[idx]={...next[idx], unit:e.target.value}; setForm(f=>({...f, line_items:next}));}} />
                    <Input className="col-span-2 text-xs h-8 text-right" type="number" placeholder="Stk. pris" value={li.unit_price??''} onChange={e=>{const p=Number(e.target.value)||0; const next=[...form.line_items]; next[idx]={...next[idx], unit_price:p, line_total:(Number(next[idx].quantity)||0)*p}; setForm(f=>({...f, line_items:next}));}} />
                    <button type="button" onClick={()=>setForm(f=>({...f, line_items:form.line_items.filter((_,i)=>i!==idx)}))} className="col-span-1 text-red-500 hover:text-red-700 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                    <div className="col-span-12 text-right text-xs text-slate-500">Linje total: {dkk((Number(li.quantity)||0)*(Number(li.unit_price)||0))}</div>
                  </div>
                ))}
                {(form.line_items||[]).length===0 && <p className="text-xs text-slate-400 text-center py-2">Ingen tilbudslinjer.</p>}
              </div>
            </div>
            <div><Label>Adresse</Label><Input value={form.address} onChange={e=>field('address',e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Status</Label><Select value={form.status} onValueChange={v=>field('status',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(statusColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div><div><Label>Indsendt</Label><Input type="date" value={form.submitted_date} onChange={e=>field('submitted_date',e.target.value)} /></div></div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={e=>field('notes',e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving?'Gemmer...':'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}