import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { ShoppingBag, CheckCircle2, AlertCircle, Package } from 'lucide-react';

const priorityBadge = { 'Høj': 'bg-red-100 text-red-700', 'Normal': 'bg-amber-100 text-amber-700', 'Lav': 'bg-slate-100 text-slate-600' };

export default function Indkoebsliste() {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setNeeds(await base44.entities.MaterialNeed.list()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const missing = needs.filter((n) => n.status === 'Mangler');
  const grouped = {};
  missing.forEach((n) => {
    const key = n.material_name;
    if (!grouped[key]) grouped[key] = { material_name: key, unit: n.unit, totalQty: 0, projects: [], estimated_price: 0, items: [] };
    grouped[key].totalQty += Number(n.quantity) || 0;
    grouped[key].projects.push(n.project_name || '—');
    grouped[key].estimated_price += (Number(n.estimated_price) || 0) * (Number(n.quantity) || 0);
    grouped[key].items.push(n);
  });
  const groups = Object.values(grouped);

  const markOrdered = async (item) => { await base44.entities.MaterialNeed.update(item.id, { status: 'Bestilt' }); load(); };
  const markGroupOrdered = async (group) => {
    for (const item of group.items) await base44.entities.MaterialNeed.update(item.id, { status: 'Bestilt' });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Indkøbsliste</h1>
      <p className="text-sm text-slate-500 mb-6">Alle manglende materialer på tværs af aktive projekter — samlet til samlet bestilling</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Package className="w-4 h-4" /> Unikke materialer</div><div className="text-2xl font-bold text-slate-900">{groups.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><ShoppingBag className="w-4 h-4" /> Manglende poster</div><div className="text-2xl font-bold text-slate-900">{missing.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><AlertCircle className="w-4 h-4" /> Estimeret værdi</div><div className="text-2xl font-bold text-slate-900">{formatDKK(groups.reduce((s, g) => s + g.estimated_price, 0))}</div></div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Alle materialer er bestilt! 🎉</p></div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.material_name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Package className="w-5 h-5 text-amber-600" /></div>
                  <div><div className="font-semibold text-slate-900">{g.material_name}</div><div className="text-sm text-slate-500">{g.totalQty} {g.unit} • {g.projects.length} projekt(er) • {formatDKK(g.estimated_price)}</div></div>
                </div>
                <button onClick={() => markGroupOrdered(g)} className="text-sm font-medium text-amber-600 hover:text-amber-700 px-4 py-2 rounded-lg border border-amber-200 hover:bg-amber-50 transition">Markér bestilt</button>
              </div>
              <div className="border-t border-slate-100 p-3 bg-slate-50">
                {g.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-2 py-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge[item.priority] || priorityBadge['Normal']}`}>{item.priority}</span>
                      <span className="text-slate-700">{item.project_name || '—'}</span>
                      <span className="text-slate-400">— {item.quantity} {item.unit}</span>
                      {item.needed_by_date && <span className="text-slate-400 text-xs">Behøves: {item.needed_by_date}</span>}
                    </div>
                    <button onClick={() => markOrdered(item)} className="text-xs text-slate-500 hover:text-amber-600">Markér bestilt</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}