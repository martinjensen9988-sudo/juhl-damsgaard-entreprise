import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Plus, Pencil, Trash2, Mail, Phone, Search } from 'lucide-react';

const CATEGORIES = ['Partner', 'Rådgiver', 'Myndighed', 'Underentreprenør', 'Leverandør', 'Andet'];
const catBadge = { 'Partner': 'bg-blue-100 text-blue-700', 'Rådgiver': 'bg-violet-100 text-violet-700', 'Myndighed': 'bg-amber-100 text-amber-700', 'Underentreprenør': 'bg-emerald-100 text-emerald-700', 'Leverandør': 'bg-stone-100 text-stone-700', 'Andet': 'bg-slate-100 text-slate-600' };
const empty = { name: '', company: '', role: '', email: '', phone: '', category: 'Partner', notes: '' };

export default function Kontaktliste() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const load = async () => { try { setContacts(await base44.entities.Contact.list()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...empty, ...c }); setDialogOpen(true); };
  const save = async () => { if (editing) await base44.entities.Contact.update(editing.id, form); else await base44.entities.Contact.create(form); setDialogOpen(false); load(); };
  const remove = async (id) => { if (!confirm('Slet kontakt?')) return; await base44.entities.Contact.delete(id); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = contacts.filter((c) => {
    if (filterCat !== 'all' && c.category !== filterCat) return false;
    if (search) { const q = search.toLowerCase(); return c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q); }
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Kontaktliste</h1><p className="text-sm text-slate-500 mt-1">Central kontaktliste for partnere, rådgivere og myndigheder</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tilføj kontakt</Button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Søg..." className="pl-9" /></div>
        <Select value={filterCat} onValueChange={setFilterCat}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle kategorier</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><UserPlus className="w-5 h-5 text-slate-600" /></div><div><div className="font-semibold text-slate-900">{c.name}</div><div className="text-xs text-slate-500">{c.role || '—'}{c.company ? ` • ${c.company}` : ''}</div></div></div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${catBadge[c.category] || catBadge['Andet']}`}>{c.category}</span>
            </div>
            <div className="space-y-1 text-sm text-slate-500">
              {c.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {c.email}</div>}
              {c.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {c.phone}</div>}
            </div>
            <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100"><button onClick={() => openEdit(c)} className="flex-1 text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1"><Pencil className="w-3.5 h-3.5" /> Rediger</button><button onClick={() => remove(c.id)} className="flex-1 text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1 border-l border-slate-100"><Trash2 className="w-3.5 h-3.5" /> Slet</button></div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-16 text-slate-400"><UserPlus className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>{contacts.length === 0 ? 'Ingen kontakter endnu' : 'Ingen resultater'}</p></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Rediger kontakt' : 'Tilføj kontakt'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Navn *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><Label>Virksomhed</Label><Input value={form.company} onChange={(e) => set('company', e.target.value)} /></div>
            <div><Label>Rolle</Label><Input value={form.role} onChange={(e) => set('role', e.target.value)} /></div>
            <div><Label>Kategori</Label><Select value={form.category} onValueChange={(v) => set('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.name}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}