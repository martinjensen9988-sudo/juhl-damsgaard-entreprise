import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Megaphone, TrendingUp } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';

const channels = ['Facebook', 'Google Ads', 'Instagram', 'LinkedIn', 'Lokal avis', 'Hjemmeside', 'Flyer', 'Andet'];
const statuses = ['Planlagt', 'Aktiv', 'Afsluttet'];
const statusColor = { Planlagt: 'bg-slate-100 text-slate-600', Aktiv: 'bg-emerald-100 text-emerald-700', Afsluttet: 'bg-slate-200 text-slate-600' };
const channelColor = { Facebook: 'bg-blue-100 text-blue-700', 'Google Ads': 'bg-red-100 text-red-700', Instagram: 'bg-pink-100 text-pink-700', LinkedIn: 'bg-sky-100 text-sky-700' };
const empty = { name: '', channel: 'Facebook', start_date: '', end_date: '', budget: '', status: 'Aktiv', inquiries: 0, quotes_sent: 0, won: 0, notes: '' };

export default function MarketingKampagner() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const c = await base44.entities.Campaign.list(); setCampaigns(c || []); } catch (e) { console.error(e); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const openCreate = () => { setEditing(null); setForm({ ...empty, start_date: new Date().toISOString().split('T')[0] }); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...empty, ...c }); setOpen(true); };

  const save = async () => {
    if (!form.name) return alert('Angiv navn');
    setSaving(true);
    try { editing ? await base44.entities.Campaign.update(editing.id, form) : await base44.entities.Campaign.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (c) => { if (!confirm('Slet kampagne?')) return; try { await base44.entities.Campaign.delete(c.id); load(); } catch (e) {} };

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'Aktiv').length,
    inquiries: campaigns.reduce((s, c) => s + (Number(c.inquiries) || 0), 0),
    won: campaigns.reduce((s, c) => s + (Number(c.won) || 0), 0),
    budget: campaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0),
  }), [campaigns]);

  const cpl = (c) => { const inq = Number(c.inquiries) || 0; const b = Number(c.budget) || 0; return inq > 0 ? b / inq : null; };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Megaphone className="w-5 h-5 text-purple-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Marketing Kampagner</h1>
            <p className="text-slate-500 mt-0.5">Se hvilke annoncer og kampagner der genererer flest henvendelser og tilbud</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Ny kampagne</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Kampagner', stats.total, 'text-slate-900'], ['Aktive', stats.active, 'text-emerald-600'], ['Henvendelser', stats.inquiries, 'text-purple-600'], ['Vundet', stats.won, 'text-amber-600']].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">{l}</div><div className={`text-2xl font-bold ${c}`}>{v}</div></div>
        ))}
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : campaigns.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen kampagner endnu</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr>
              <th className="text-left px-4 py-3 font-medium">Kampagne</th>
              <th className="text-left px-4 py-3 font-medium">Kanal</th>
              <th className="text-left px-4 py-3 font-medium">Periode</th>
              <th className="text-right px-4 py-3 font-medium">Budget</th>
              <th className="text-right px-4 py-3 font-medium">Henv.</th>
              <th className="text-right px-4 py-3 font-medium">Tilbud</th>
              <th className="text-right px-4 py-3 font-medium">Vundet</th>
              <th className="text-right px-4 py-3 font-medium">CPL</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => {
                const cost = cpl(c);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${channelColor[c.channel] || 'bg-slate-100 text-slate-600'}`}>{c.channel}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(c.start_date)} – {formatDate(c.end_date)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatDKK(c.budget)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{c.inquiries || 0}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{c.quotes_sent || 0}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{c.won || 0}</td>
                    <td className="px-4 py-3 text-right text-xs"><span className="flex items-center justify-end gap-0.5 text-slate-600"><TrendingUp className="w-3 h-3" />{cost != null ? formatDKK(cost) : '—'}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[c.status]}`}>{c.status}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => openEdit(c)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button><button onClick={() => remove(c)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger kampagne' : 'Ny kampagne'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Navn *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kanal</Label><Select value={form.channel} onValueChange={(v) => set('channel', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{channels.map((ch) => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start</Label><Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} /></div>
              <div><Label>Slut</Label><Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} /></div>
            </div>
            <div><Label>Budget (DKK)</Label><Input type="number" value={form.budget} onChange={(e) => set('budget', e.target.value ? Number(e.target.value) : '')} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Henvendelser</Label><Input type="number" value={form.inquiries} onChange={(e) => set('inquiries', Number(e.target.value) || 0)} /></div>
              <div><Label>Tilbud sendt</Label><Input type="number" value={form.quotes_sent} onChange={(e) => set('quotes_sent', Number(e.target.value) || 0)} /></div>
              <div><Label>Vundet</Label><Input type="number" value={form.won} onChange={(e) => set('won', Number(e.target.value) || 0)} /></div>
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