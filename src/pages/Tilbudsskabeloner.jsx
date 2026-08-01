import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LayoutTemplate, Plus, Pencil, Trash2, X } from 'lucide-react';

const CATEGORIES = ['Standard', 'Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Andet'];
const catBadge = { 'Standard': 'bg-slate-100 text-slate-700', 'Gravearbejde': 'bg-amber-100 text-amber-700', 'Kloak': 'bg-blue-100 text-blue-700', 'Asfalt': 'bg-slate-700 text-white', 'Beton': 'bg-stone-100 text-stone-700', 'Nedrivning': 'bg-red-100 text-red-700', 'Anlæg': 'bg-emerald-100 text-emerald-700', 'Andet': 'bg-slate-100 text-slate-600' };
const lineTotal = (items = []) => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
const empty = { title: '', category: 'Standard', description: '', line_items: [], terms: '', notes: '' };

export default function Tilbudsskabeloner() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => { try { setTemplates(await base44.entities.QuoteTemplate.list()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...empty, ...t }); setDialogOpen(true); };
  const save = async () => { if (editing) await base44.entities.QuoteTemplate.update(editing.id, form); else await base44.entities.QuoteTemplate.create(form); setDialogOpen(false); load(); };
  const remove = async (id) => { if (!confirm('Slet skabelon?')) return; await base44.entities.QuoteTemplate.delete(id); load(); };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addLine = () => setForm((f) => ({ ...f, line_items: [...(f.line_items || []), { description: '', quantity: 1, unit: 'stk', unit_price: 0 }] }));
  const updateLine = (i, k, v) => setForm((f) => { const li = [...(f.line_items || [])]; li[i] = { ...li[i], [k]: v }; return { ...f, line_items: li }; });
  const removeLine = (i) => setForm((f) => ({ ...f, line_items: (f.line_items || []).filter((_, idx) => idx !== i) }));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Tilbudsskabeloner</h1><p className="text-sm text-slate-500 mt-1">Faste tekstblokke og standardbetingelser til hurtigere tilbudsgivning</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Ny skabelon</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${catBadge[t.category] || catBadge['Standard']}`}>{t.category}</span>
              <div className="flex gap-1"><button onClick={() => openEdit(t)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button><button onClick={() => remove(t.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{t.title}</h3>
            {t.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{t.description}</p>}
            <div className="text-xs text-slate-400">{(t.line_items || []).length} standardlinjer • {formatDKK(lineTotal(t.line_items))}</div>
          </div>
        ))}
      </div>
      {templates.length === 0 && <div className="text-center py-16 text-slate-400"><LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Ingen skabeloner endnu</p></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger skabelon' : 'Ny skabelon'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div><Label>Kategori</Label><Select value={form.category} onValueChange={(v) => set('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} /></div>
          </div>
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between mb-3"><div className="text-sm font-semibold text-slate-700">Standardlinjer</div><Button size="sm" variant="outline" onClick={addLine} className="gap-1"><Plus className="w-3.5 h-3.5" /> Tilføj linje</Button></div>
            <div className="space-y-2">
              {(form.line_items || []).map((li, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder="Beskrivelse" value={li.description} onChange={(e) => updateLine(i, 'description', e.target.value)} className="flex-1" />
                  <Input type="number" placeholder="Antal" value={li.quantity} onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))} className="w-20" />
                  <Input placeholder="Enhed" value={li.unit} onChange={(e) => updateLine(i, 'unit', e.target.value)} className="w-16" />
                  <Input type="number" placeholder="Pris" value={li.unit_price} onChange={(e) => updateLine(i, 'unit_price', Number(e.target.value))} className="w-28" />
                  <button onClick={() => removeLine(i)} className="text-slate-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {(form.line_items || []).length === 0 && <p className="text-sm text-slate-400">Ingen linjer</p>}
            </div>
            {(form.line_items || []).length > 0 && <div className="mt-3 text-right text-sm font-medium text-slate-700">Total: {formatDKK(lineTotal(form.line_items))}</div>}
          </div>
          <div className="border-t pt-4 mt-2"><Label>Standardbetingelser</Label><Textarea value={form.terms} onChange={(e) => set('terms', e.target.value)} rows={3} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.title}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}