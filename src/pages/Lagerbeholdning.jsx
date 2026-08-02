import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDKK } from '@/lib/format';
import { Search, Package, PackageX, AlertTriangle, CheckCircle2, Boxes } from 'lucide-react';

const categories = ['Beton', 'Asfalt', 'Kloak', 'Jord', 'Sten', 'Metal', 'Træ', 'Andet'];

export default function Lagerbeholdning() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [view, setView] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.InventoryItem.list();
      setItems(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const enriched = useMemo(() => items.map((i) => {
    const stock = Number(i.stock_quantity) || 0;
    const min = Number(i.min_stock_level) || 0;
    const level = stock === 0 ? 'empty' : min > 0 && stock <= min / 2 ? 'critical' : stock <= min ? 'low' : 'ok';
    return { ...i, _stock: stock, _min: min, _level: level };
  }), [items]);

  const stats = useMemo(() => ({
    total: items.length,
    below: enriched.filter((i) => ['empty', 'critical', 'low'].includes(i._level)).length,
    empty: enriched.filter((i) => i._level === 'empty').length,
    value: enriched.reduce((s, i) => s + i._stock * (Number(i.unit_price) || 0), 0),
  }), [enriched]);

  const filtered = useMemo(() => enriched.filter((i) => {
    const ms = !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.supplier_name?.toLowerCase().includes(search.toLowerCase());
    const mc = categoryFilter === 'all' || i.category === categoryFilter;
    const mv = view === 'all' || (view === 'low' && ['empty', 'critical', 'low'].includes(i._level));
    return ms && mc && mv;
  }), [enriched, search, categoryFilter, view]);

  const levelStyle = {
    empty: { row: 'bg-red-50 border-l-4 border-red-500', badge: 'bg-red-100 text-red-700', label: 'Tømt', icon: PackageX },
    critical: { row: 'bg-orange-50 border-l-4 border-orange-500', badge: 'bg-orange-100 text-orange-700', label: 'Kritisk', icon: AlertTriangle },
    low: { row: 'bg-amber-50 border-l-4 border-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Under min.', icon: AlertTriangle },
    ok: { row: 'bg-white border-l-4 border-emerald-300', badge: 'bg-emerald-100 text-emerald-700', label: 'OK', icon: CheckCircle2 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <Boxes className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Lagerbeholdning</h1>
          <p className="text-slate-500 mt-0.5">Aktuelle lagerniveauer — varer under minimum fremhæves automatisk</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Total varer</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Under minimum</div>
          <div className="text-2xl font-bold text-amber-600">{stats.below}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Tømte</div>
          <div className="text-2xl font-bold text-red-600">{stats.empty}</div>
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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={view} onValueChange={setView}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle varer</SelectItem>
            <SelectItem value="low">Kun under minimum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Indlæser...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen varer fundet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Materiale</th>
                <th className="text-left px-4 py-3 font-medium">Kategori</th>
                <th className="text-right px-4 py-3 font-medium">Beholdning</th>
                <th className="text-right px-4 py-3 font-medium">Min.</th>
                <th className="text-left px-4 py-3 font-medium">Niveau</th>
                <th className="text-left px-4 py-3 font-medium">Lagerplads</th>
                <th className="text-left px-4 py-3 font-medium">Leverandør</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((i) => {
                const s = levelStyle[i._level];
                const Icon = s.icon;
                return (
                  <tr key={i.id} className={s.row}>
                    <td className="px-4 py-3 font-medium text-slate-900">{i.name}</td>
                    <td className="px-4 py-3 text-slate-500">{i.category || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{i._stock} <span className="text-xs font-normal text-slate-400">{i.unit}</span></td>
                    <td className="px-4 py-3 text-right text-slate-500">{i._min} <span className="text-xs text-slate-400">{i.unit}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
                        <Icon className="w-3 h-3" /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{i.location || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{i.supplier_name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}