import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Pencil, Trash2, Phone, Mail, Building2, Briefcase } from 'lucide-react';

const CATEGORIES = ['Partner', 'Rådgiver', 'Myndighed', 'Underentreprenør', 'Leverandør', 'Andet'];
const CAT_COLORS = {
  Partner: 'bg-blue-100 text-blue-700',
  Rådgiver: 'bg-purple-100 text-purple-700',
  Myndighed: 'bg-amber-100 text-amber-700',
  Underentreprenør: 'bg-teal-100 text-teal-700',
  Leverandør: 'bg-slate-100 text-slate-700',
  Andet: 'bg-gray-100 text-gray-700',
};

const empty = {
  name: '', company: '', role: '', email: '', phone: '',
  category: 'Partner', linked_project_id: '', linked_project_name: '', linked_task: '', notes: '',
};

export default function Samarbejdspartnere() {
  const [partners, setPartners] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [p, proj] = await Promise.all([
        base44.entities.Contact.list('-created_date', 500),
        base44.entities.Project.list('-created_date', 500),
      ]);
      setPartners(p);
      setProjects(proj);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = partners.filter((p) => {
    const matchesSearch = `${p.name} ${p.company || ''} ${p.email || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filter === 'all' || p.category === filter;
    return matchesSearch && matchesCat;
  });

  const openCreate = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ ...empty, ...p });
    setEditId(p.id);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const project = projects.find((p) => p.id === form.linked_project_id);
    const payload = { ...form, linked_project_name: project?.name || '' };
    try {
      if (editId) {
        await base44.entities.Contact.update(editId, payload);
        toast({ title: 'Partner opdateret' });
      } else {
        await base44.entities.Contact.create(payload);
        toast({ title: 'Partner oprettet' });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Slet ${p.name}?`)) return;
    try {
      await base44.entities.Contact.delete(p.id);
      toast({ title: 'Partner slettet' });
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Samarbejdspartnere</h1>
          <p className="text-slate-500 text-sm mt-1">Eksterne partnere knyttet til projekter og opgaver.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj partner</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Søg partner, virksomhed eller email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-slate-400">Ingen partnere fundet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{p.company || '—'}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${CAT_COLORS[p.category] || CAT_COLORS.Andet}`}>{p.category}</span>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                {p.role && <div className="text-slate-500">Rolle: <span className="text-slate-700">{p.role}</span></div>}
                {p.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{p.email}</div>}
                {p.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{p.phone}</div>}
                {p.linked_project_name && (
                  <div className="mt-2 pt-2 border-t text-xs">
                    <span className="text-slate-400">Knyttet projekt:</span>{' '}
                    <span className="font-medium text-slate-700">{p.linked_project_name}</span>
                  </div>
                )}
                {p.linked_task && <div className="text-xs text-slate-500">Opgave: {p.linked_task}</div>}
              </div>

              <div className="mt-4 flex gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /> Rediger</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(p)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Rediger partner' : 'Tilføj partner'}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Navn *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Virksomhed</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Rolle</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="f.eks. Arkitekt" />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Knyttet projekt</Label>
                <Select value={form.linked_project_id || 'none'} onValueChange={(v) => setForm({ ...form, linked_project_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Intet projekt —</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Knyttet opgave</Label>
                <Input value={form.linked_task} onChange={(e) => setForm({ ...form, linked_task: e.target.value })} placeholder="f.eks. Projekteringsmøde" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Noter</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuller</Button>
              <Button type="submit">Gem</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}