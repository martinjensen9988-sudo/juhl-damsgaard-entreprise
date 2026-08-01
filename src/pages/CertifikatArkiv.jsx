import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BadgeCheck, Plus, Pencil, Trash2, AlertTriangle, Search, Award } from 'lucide-react';

const TYPES = ['Maskinførerbevis', 'Førstehjælp', 'Arbejdsmiljø', 'Svejsebevis', 'Kranbevis', 'Truckbevis', 'Håndværk', 'Andet'];
const empty = { employee_name: '', title: '', type: 'Andet', issue_date: '', expiry_date: '', file_url: '', notes: '' };

export default function CertifikatArkiv() {
  const [certs, setCerts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const [c, e] = await Promise.all([base44.entities.Certificate.list(), base44.entities.Employee.list()]);
      setCerts(c); setEmployees(e);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...empty, ...c }); setDialogOpen(true); };
  const save = async () => { if (editing) await base44.entities.Certificate.update(editing.id, form); else await base44.entities.Certificate.create(form); setDialogOpen(false); load(); };
  const remove = async (id) => { if (!confirm('Slet certifikat?')) return; await base44.entities.Certificate.delete(id); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const daysUntil = (d) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;
  const getStatus = (c) => {
    const days = daysUntil(c.expiry_date);
    if (days === null) return { label: 'Uden udløb', color: 'bg-slate-100 text-slate-600', urgent: false };
    if (days < 0) return { label: 'Udløbet', color: 'bg-red-100 text-red-700', urgent: true };
    if (days < 30) return { label: `Udløber (${days}d)`, color: 'bg-amber-100 text-amber-700', urgent: true };
    if (days < 90) return { label: `Udløber (${days}d)`, color: 'bg-blue-100 text-blue-700', urgent: false };
    return { label: 'Gyldig', color: 'bg-emerald-100 text-emerald-700', urgent: false };
  };

  const sorted = [...certs].sort((a, b) => (daysUntil(a.expiry_date) || 9999) - (daysUntil(b.expiry_date) || 9999));
  const filtered = sorted.filter((c) => {
    if (filter === 'urgent' && !getStatus(c).urgent) return false;
    if (filter === 'expired' && (daysUntil(c.expiry_date) !== null && daysUntil(c.expiry_date) >= 0)) return false;
    if (search) { const q = search.toLowerCase(); return c.employee_name?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q); }
    return true;
  });
  const urgentCount = certs.filter((c) => getStatus(c).urgent).length;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Certifikat Arkiv</h1><p className="text-sm text-slate-500 mt-1">Administration af medarbejdercertifikater med udløbsadvarsler</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tilføj certifikat</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Award className="w-4 h-4" /> Total certifikater</div><div className="text-2xl font-bold text-slate-900">{certs.length}</div></div>
        <div className={`bg-white rounded-xl border p-5 ${urgentCount > 0 ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><AlertTriangle className="w-4 h-4" /> Udløber snart</div><div className="text-2xl font-bold text-amber-600">{urgentCount}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><BadgeCheck className="w-4 h-4" /> Gyldige</div><div className="text-2xl font-bold text-emerald-600">{certs.filter((c) => getStatus(c).label === 'Gyldig').length}</div></div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg medarbejder eller certifikat..." className="pl-9" /></div>
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle</SelectItem><SelectItem value="urgent">Udløber snart</SelectItem><SelectItem value="expired">Udløbet</SelectItem></SelectContent></Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const st = getStatus(c);
          return (
            <div key={c.id} className={`bg-white rounded-xl border p-5 ${st.urgent ? 'border-amber-300' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><BadgeCheck className="w-5 h-5 text-slate-600" /></div><div><div className="font-semibold text-slate-900">{c.title}</div><div className="text-xs text-slate-500">{c.employee_name}</div></div></div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
              </div>
              <div className="space-y-1 text-sm text-slate-500">
                <div className="flex justify-between"><span>Type</span><span className="text-slate-700">{c.type}</span></div>
                {c.issue_date && <div className="flex justify-between"><span>Udstedt</span><span className="text-slate-700">{formatDate(c.issue_date)}</span></div>}
                {c.expiry_date && <div className="flex justify-between"><span>Udløb</span><span className={`font-medium ${st.urgent ? 'text-amber-700' : 'text-slate-700'}`}>{formatDate(c.expiry_date)}</span></div>}
              </div>
              <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                {c.file_url && <a href={c.file_url} target="_blank" rel="noreferrer" className="flex-1 text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1"><Award className="w-3.5 h-3.5" /> Vis</a>}
                <button onClick={() => openEdit(c)} className="flex-1 text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 border-l border-slate-100"><Pencil className="w-3.5 h-3.5" /> Rediger</button>
                <button onClick={() => remove(c.id)} className="flex-1 text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1 border-l border-slate-100"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="text-center py-16 text-slate-400"><BadgeCheck className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>{certs.length === 0 ? 'Ingen certifikater endnu' : 'Ingen resultater'}</p></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Rediger certifikat' : 'Tilføj certifikat'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Medarbejder *</Label><Select value={form.employee_name} onValueChange={(v) => set('employee_name', v)}><SelectTrigger><SelectValue placeholder="Vælg..." /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Certifikat *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div className="col-span-2"><Label>Type</Label><Select value={form.type} onValueChange={(v) => set('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Udstedt</Label><Input type="date" value={form.issue_date} onChange={(e) => set('issue_date', e.target.value)} /></div>
            <div><Label>Udløb</Label><Input type="date" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} /></div>
            <div className="col-span-2"><Label>Fil-URL</Label><Input value={form.file_url} onChange={(e) => set('file_url', e.target.value)} placeholder="https://..." /></div>
            <div className="col-span-2"><Label>Noter</Label><Input value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.title || !form.employee_name}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}