import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDKK } from '@/lib/format';
import { AlertTriangle, Package, Search, Plus, Pencil, Trash2, Bell, BellRing, CheckCircle2, XCircle, PackageOpen, Send } from 'lucide-react';

const categories = ['Beton', 'Asfalt', 'Kloak', 'Jord', 'Sten', 'Metal', 'Træ', 'Andet'];

const emptyForm = {
  name: '',
  category: 'Andet',
  stock_quantity: '',
  min_stock_level: '',
  unit: 'stk',
  unit_price: '',
  location: '',
  supplier_name: '',
  notes: '',
};

export default function LagerOverblik() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.InventoryItem.list();
      setItems(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const enriched = useMemo(() => items.map((i) => {
    const stock = Number(i.stock_quantity) || 0;
    const min = Number(i.min_stock_level) || 0;
    const level = stock === 0 ? 'empty' : min > 0 && stock <= min / 2 ? 'critical' : stock <= min ? 'low' : min > 0 && stock <= min * 1.5 ? 'ok' : 'good';
    return { ...i, _stock: stock, _min: min, _level: level };
  }), [items]);

  const stats = useMemo(() => ({
    total: items.length,
    empty: enriched.filter((i) => i._level === 'empty').length,
    critical: enriched.filter((i) => i._level === 'critical').length,
    low: enriched.filter((i) => i._level === 'low').length,
    ok: enriched.filter((i) => i._level === 'ok' || i._level === 'good').length,
    value: enriched.reduce((s, i) => s + i._stock * (Number(i.unit_price) || 0), 0),
  }), [enriched]);

  const filtered = useMemo(() => {
    return enriched.filter((i) => {
      const ms = !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.supplier_name?.toLowerCase().includes(search.toLowerCase());
      const mf = filter === 'all' ||
        (filter === 'low' && ['empty', 'critical', 'low'].includes(i._level)) ||
        (filter === 'critical' && ['empty', 'critical'].includes(i._level)) ||
        (filter === 'ok' && ['ok', 'good'].includes(i._level));
      return ms && mf;
    });
  }, [enriched, search, filter]);

  const handleField = (f, v) => setForm((s) => ({ ...s, [f]: v }));

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({ ...emptyForm, ...i, stock_quantity: String(i.stock_quantity ?? ''), min_stock_level: String(i.min_stock_level ?? ''), unit_price: String(i.unit_price ?? '') }); setDialogOpen(true); };

  const save = async () => {
    if (!form.name) { alert('Angiv et materialnavn'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        stock_quantity: Number(form.stock_quantity) || 0,
        min_stock_level: Number(form.min_stock_level) || 0,
        unit_price: Number(form.unit_price) || 0,
      };
      if (editing) await base44.entities.InventoryItem.update(editing.id, payload);
      else await base44.entities.InventoryItem.create(payload);
      setDialogOpen(false);
      loadData();
    } catch (e) { console.error(e); alert('Fejl ved lagring'); }
    setSaving(false);
  };

  const remove = async (i) => {
    if (!confirm(`Slet "${i.name}"?`)) return;
    try { await base44.entities.InventoryItem.delete(i.id); loadData(); }
    catch (e) { console.error(e); }
  };

  const runCheck = async () => {
    setChecking(true);
    try {
      const res = await base44.functions.invoke('checkLowStock', {});
      setLastCheck(res.data);
    } catch (e) { console.error(e); alert('Kunne ikke køre lagerkontrol'); }
    setChecking(false);
  };

  const levelBadge = {
    empty: { label: 'Tømt', cls: 'bg-red-100 text-red-700', icon: XCircle },
    critical: { label: 'Kritisk', cls: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    low: { label: 'Lav', cls: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    ok: { label: 'OK', cls: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    good: { label: 'God', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  };

  const barColor = {
    empty: 'bg-red-500',
    critical: 'bg-orange-500',
    low: 'bg-amber-500',
    ok: 'bg-blue-500',
    good: 'bg-emerald-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Lageroverblik</h1>
            <p className="text-slate-500 mt-0.5">Overvåg beholdning — automatisk besked ved lavt niveau</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runCheck} disabled={checking}>
            {checking ? <><Send className="w-4 h-4 animate-pulse" /> Tjekker...</> : <><BellRing className="w-4 h-4" /> Kør lagerkontrol</>}
          </Button>
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj vare</Button>
        </div>
      </div>

      {/* Auto-check info banner */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <Bell className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
        <div>
          <span className="font-medium">Automatisk overvågning:</span> Systemet tjekker lagerniveauer hver hverdag kl. 08:00 og sender automatisk en e-mail til alle admin-brugere, når varer falder under minimumsniveauet. Brug "Kør lagerkontrol" for et øjeblikkeligt tjek.
        </div>
      </div>

      {/* Last check result */}
      {lastCheck && (
        <div className={`rounded-xl p-4 border ${lastCheck.lowStockCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            {lastCheck.lowStockCount > 0 ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {lastCheck.lowStockCount > 0
              ? `${lastCheck.lowStockCount} varer under minimum (${lastCheck.criticalCount} kritiske) — ${lastCheck.emailsSent} e-mail(s) sendt`
              : 'Alle lagerniveauer er OK'}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Total varer</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Tømte</div>
          <div className="text-2xl font-bold text-red-600">{stats.empty}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Kritiske</div>
          <div className="text-2xl font-bold text-orange-600">{stats.critical}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Lave</div>
          <div className="text-2xl font-bold text-amber-600">{stats.low}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Lagerværdi</div>
          <div className="text-2xl font-bold text-slate-900">{formatDKK(stats.value)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Søg varer eller leverandør..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle varer</SelectItem>
            <SelectItem value="critical">Kritiske/tømte</SelectItem>
            <SelectItem value="low">Under minimum</SelectItem>
            <SelectItem value="ok">OK beholdning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Indlæser...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen varer fundet</p>
          <Button onClick={openCreate} variant="outline" className="mt-4"><Plus className="w-4 h-4" /> Tilføj første vare</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => {
            const badge = levelBadge[i._level];
            const pct = i._min > 0 ? Math.min(100, Math.round((i._stock / (i._min * 2)) * 100)) : 100;
            const Icon = badge.icon;
            return (
              <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${badge.cls}`}>
                      {i._level === 'empty' ? <PackageOpen className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{i.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.cls}`}>{badge.label}</span>
                        {i.category && <span className="text-xs text-slate-400">· {i.category}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500 mt-1">
                        {i.location && <span>📍 {i.location}</span>}
                        {i.supplier_name && <span>🚚 {i.supplier_name}</span>}
                        {i.unit_price > 0 && <span>💰 {formatDKK(i.unit_price)}/{i.unit}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-slate-900">{i._stock} <span className="text-xs font-normal text-slate-400">{i.unit}</span></div>
                    <div className="text-xs text-slate-400">min. {i._min} {i.unit}</div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(i)} className="p-1.5 text-slate-400 hover:text-slate-900"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(i)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {i._min > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor[i._level]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger vare' : 'Tilføj lagervare'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Materialnavn *</Label>
              <Input value={form.name} onChange={(e) => handleField('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => handleField('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Enhed</Label>
                <Input value={form.unit} onChange={(e) => handleField('unit', e.target.value)} placeholder="stk, m², kg..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Beholdning</Label>
                <Input type="number" value={form.stock_quantity} onChange={(e) => handleField('stock_quantity', e.target.value)} />
              </div>
              <div>
                <Label>Min. beholdning</Label>
                <Input type="number" value={form.min_stock_level} onChange={(e) => handleField('min_stock_level', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Stk. pris (DKK)</Label>
                <Input type="number" value={form.unit_price} onChange={(e) => handleField('unit_price', e.target.value)} />
              </div>
              <div>
                <Label>Lagerplads</Label>
                <Input value={form.location} onChange={(e) => handleField('location', e.target.value)} placeholder="f.eks. Hylden A3" />
              </div>
            </div>
            <div>
              <Label>Leverandør</Label>
              <Input value={form.supplier_name} onChange={(e) => handleField('supplier_name', e.target.value)} />
            </div>
            <div>
              <Label>Noter</Label>
              <Input value={form.notes} onChange={(e) => handleField('notes', e.target.value)} />
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