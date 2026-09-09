import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';

const categories = ['Forsikring', 'Leasing', 'Husleje', 'Løn', 'Brændstof', 'Telefon/Internet', 'Software', 'El/Vand/Varme', 'Markedsføring', 'Andet'];
const frequencies = ['Månedlig', 'Kvartalvis', 'Halvårlig', 'Årlig'];
const freqMultiplier = { Månedlig: 12, Kvartalvis: 4, Halvårlig: 2, Årlig: 1 };
const empty = { name: '', category: 'Andet', amount: '', frequency: 'Månedlig', next_due_date: '', supplier: '', notes: '' };

const catColor = {
  Forsikring: 'bg-red-100 text-red-700', Leasing: 'bg-blue-100 text-blue-700', Husleje: 'bg-amber-100 text-amber-700',
  Løn: 'bg-emerald-100 text-emerald-700', Brændstof: 'bg-orange-100 text-orange-700', 'Telefon/Internet': 'bg-purple-100 text-purple-700',
  Software: 'bg-sky-100 text-sky-700', 'El/Vand/Varme': 'bg-cyan-100 text-cyan-700', Markedsføring: 'bg-pink-100 text-pink-700', Andet: 'bg-slate-100 text-slate-600',
};

export default function Driftsbudget() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const i = await base44.entities.BudgetItem.list(); setItems(i || []); } catch (e) { console.error(e); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({ ...empty, ...i }); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.amount) return alert('Angiv post og beløb');
    setSaving(true);
    try { editing ? await base44.entities.BudgetItem.update(editing.id, form) : await base44.entities.BudgetItem.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (i) => { if (!confirm('Slet post?')) return; try { await base44.entities.BudgetItem.delete(i.id); load(); } catch (e) {} };

  const monthly = (i) => (Number(i.amount) || 0) * (freqMultiplier[i.frequency] || 12) / 12;

  const stats = useMemo(() => {
    const totalMonthly = items.reduce((s, i) => s + monthly(i), 0);
    const totalYearly = items.reduce((s, i) => s + monthly(i) * 12, 0);
    const byCat = {};
    items.forEach((i) => { byCat[i.category] = (byCat[i.category] || 0) + monthly(i); });
    const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    return { totalMonthly, totalYearly, byCat: sorted, topCat: sorted[0] };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Wallet className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Driftsbudget</h1>
            <p className="text-slate-500 mt-0.5">Faste omkostninger — forsikringer, leasing, husleje og løbende udgifter</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj post</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Månedlig drift</div><div className="text-2xl font-bold text-slate-900">{formatDKK(stats.totalMonthly)}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Årlig drift</div><div className="text-2xl font-bold text-slate-700">{formatDKK(stats.totalYearly)}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Største post</div><div className="text-2xl font-bold text-amber-600 truncate">{stats.topCat ? stats.topCat[0] : '—'}</div></div>
      </div>

      {/* Category breakdown */}
      {stats.byCat.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Fordeling pr. kategori (månedlig)</h3>
          <div className="space-y-2">
            {stats.byCat.map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-32 truncate">{cat}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${stats.totalMonthly ? (amt / stats.totalMonthly) * 100 : 0}%` }} /></div>
                <span className="text-sm font-medium text-slate-700 w-24 text-right">{formatDKK(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen budgetposter endnu</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr>
              <th className="text-left px-4 py-3 font-medium">Post</th>
              <th className="text-left px-4 py-3 font-medium">Kategori</th>
              <th className="text-left px-4 py-3 font-medium">Hyppighed</th>
              <th className="text-right px-4 py-3 font-medium">Beløb</th>
              <th className="text-right px-4 py-3 font-medium">Pr. måned</th>
              <th className="text-left px-4 py-3 font-medium">Næste betaling</th>
              <th className="text-left px-4 py-3 font-medium">Leverandør</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{i.name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${catColor[i.category] || 'bg-slate-100 text-slate-600'}`}>{i.category}</span></td>
                  <td className="px-4 py-3 text-slate-500">{i.frequency}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatDKK(i.amount)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatDKK(monthly(i))}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(i.next_due_date)}</td>
                  <td className="px-4 py-3 text-slate-500">{i.supplier || '—'}</td>
                  <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => openEdit(i)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button><button onClick={() => remove(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger post' : 'Tilføj post'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Post *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="fx Virksomhedsforsikring" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kategori</Label><Select value={form.category} onValueChange={(v) => set('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Hyppighed</Label><Select value={form.frequency} onValueChange={(v) => set('frequency', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{frequencies.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Beløb (DKK) *</Label><Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value ? Number(e.target.value) : '')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Næste betaling</Label><Input type="date" value={form.next_due_date} onChange={(e) => set('next_due_date', e.target.value)} /></div>
              <div><Label>Leverandør</Label><Input value={form.supplier} onChange={(e) => set('supplier', e.target.value)} /></div>
            </div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}