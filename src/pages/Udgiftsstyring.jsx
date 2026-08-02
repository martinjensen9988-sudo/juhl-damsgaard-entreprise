import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDKK, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Wallet, TrendingDown, AlertCircle, Search, PieChart } from 'lucide-react';

const categories = ['Materialer', 'Maskiner', 'Transport', 'Lønninger', 'Brændstof', 'Forsikring', 'Værktøj', 'Kontor', 'Markedsføring', 'Andet'];

const emptyForm = {
  title: '',
  category: 'Materialer',
  amount: '',
  date: '',
  project_id: '',
  project_name: '',
  supplier_name: '',
  recurring: false,
  notes: '',
};

export default function Udgiftsstyring() {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [projFilter, setProjFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([
        base44.entities.Expense.list('-date'),
        base44.entities.Project.list().catch(() => []),
      ]);
      setExpenses(e || []);
      setProjects(p || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => expenses.filter((e) => {
    const ms = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.supplier_name?.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'all' || e.category === catFilter;
    const mp = projFilter === 'all' || e.project_id === projFilter;
    return ms && mc && mp;
  }), [expenses, search, catFilter, projFilter]);

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const byCat = {};
    expenses.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + (Number(e.amount) || 0); });
    return { total, byCat };
  }, [expenses]);

  // Project budget tracking
  const projectBudgets = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      map[p.id] = { name: p.name, budget: Number(p.budget) || 0, spent: 0, expenseCount: 0 };
    });
    expenses.forEach((e) => {
      if (e.project_id && map[e.project_id]) {
        map[e.project_id].spent += Number(e.amount) || 0;
        map[e.project_id].expenseCount++;
      }
    });
    return Object.values(map).filter((p) => p.budget > 0 || p.spent > 0);
  }, [expenses, projects]);

  const handleField = (f, v) => setForm((s) => ({ ...s, [f]: v }));

  const handleProject = (id) => {
    const p = projects.find((x) => x.id === id);
    if (p) setForm((f) => ({ ...f, project_id: p.id, project_name: p.name }));
    else setForm((f) => ({ ...f, project_id: '', project_name: '' }));
  };

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] }); setDialogOpen(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...emptyForm, ...e, amount: String(e.amount ?? '') }); setDialogOpen(true); };

  const save = async () => {
    if (!form.title || !form.category || !form.amount || !form.date) { alert('Udfyld titel, kategori, beløb og dato'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) || 0 };
      if (editing) await base44.entities.Expense.update(editing.id, payload);
      else await base44.entities.Expense.create(payload);
      setDialogOpen(false);
      loadData();
    } catch (e) { console.error(e); alert('Fejl ved lagring'); }
    setSaving(false);
  };

  const remove = async (e) => {
    if (!confirm(`Slet udgift "${e.title}"?`)) return;
    try { await base44.entities.Expense.delete(e.id); loadData(); }
    catch (err) { console.error(err); }
  };

  const topCats = Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = topCats.length > 0 ? topCats[0][1] : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Udgiftsstyring</h1>
            <p className="text-slate-500 mt-0.5">Registrer projektudgifter og match dem mod budgetter</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Ny udgift</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Total udgifter</div>
          <div className="text-2xl font-bold text-slate-900">{formatDKK(stats.total)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Antal poster</div>
          <div className="text-2xl font-bold text-slate-900">{expenses.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Største kategori</div>
          <div className="text-lg font-bold text-slate-900 truncate">{topCats[0]?.[0] || '—'}</div>
          {topCats[0] && <div className="text-xs text-slate-400">{formatDKK(topCats[0][1])}</div>}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Projekter over budget</div>
          <div className="text-2xl font-bold text-red-600">
            {projectBudgets.filter((p) => p.budget > 0 && p.spent > p.budget).length}
          </div>
        </div>
      </div>

      {/* Project budget tracking */}
      {projectBudgets.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-600" /> Projektbudgetter vs. forbrug
          </h3>
          <div className="space-y-3">
            {projectBudgets.map((p) => {
              const pct = p.budget > 0 ? Math.min(100, Math.round((p.spent / p.budget) * 100)) : 0;
              const over = p.budget > 0 && p.spent > p.budget;
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{p.name}</span>
                      {over && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    <span className={over ? 'text-red-600 font-medium' : 'text-slate-500'}>
                      {formatDKK(p.spent)} / {formatDKK(p.budget)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {topCats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top kategorier</h3>
          <div className="space-y-2.5">
            {topCats.map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-28 text-sm text-slate-600 flex-shrink-0">{cat}</div>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(amt / maxCat) * 100}%` }} />
                </div>
                <div className="w-24 text-sm font-medium text-slate-700 text-right">{formatDKK(amt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Søg titel eller leverandør..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={projFilter} onValueChange={setProjFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Projekt" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle projekter</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Indlæser...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen udgifter fundet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Titel</th>
                  <th className="text-left px-4 py-3 font-medium">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium">Projekt</th>
                  <th className="text-left px-4 py-3 font-medium">Leverandør</th>
                  <th className="text-left px-4 py-3 font-medium">Dato</th>
                  <th className="text-right px-4 py-3 font-medium">Beløb</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 group">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{e.title}</div>
                      {e.recurring && <span className="text-[10px] text-amber-600 font-medium">↻ Tilbagevendende</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{e.category}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]">{e.project_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{e.supplier_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatDKK(e.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openEdit(e)} className="p-1.5 text-slate-400 hover:text-slate-900"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(e)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm font-medium text-slate-600">I alt ({filtered.length})</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatDKK(filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger udgift' : 'Ny udgift'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Titel *</Label>
              <Input value={form.title} onChange={(e) => handleField('title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori *</Label>
                <Select value={form.category} onValueChange={(v) => handleField('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Beløb (DKK) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => handleField('amount', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dato *</Label>
                <Input type="date" value={form.date} onChange={(e) => handleField('date', e.target.value)} />
              </div>
              <div>
                <Label>Projekt</Label>
                <Select value={form.project_id} onValueChange={handleProject}>
                  <SelectTrigger><SelectValue placeholder="Valgfrit" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Leverandør</Label>
              <Input value={form.supplier_name} onChange={(e) => handleField('supplier_name', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="recurring" checked={form.recurring} onChange={(e) => handleField('recurring', e.target.checked)} className="w-4 h-4 rounded" />
              <Label htmlFor="recurring" className="cursor-pointer">Tilbagevendende udgift</Label>
            </div>
            <div>
              <Label>Noter</Label>
              <Textarea value={form.notes} onChange={(e) => handleField('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}