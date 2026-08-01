import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Loader2, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { formatDKK, formatDate } from '@/lib/format';

const COLUMNS = [
  { key: 'Kladde', label: 'Kladde', icon: ClipboardList, color: 'border-slate-300 bg-slate-50' },
  { key: 'Bestilt', label: 'Bestilt', icon: Truck, color: 'border-blue-300 bg-blue-50' },
  { key: 'Modtaget', label: 'Modtaget', icon: CheckCircle2, color: 'border-emerald-300 bg-emerald-50' },
  { key: 'Annulleret', label: 'Annulleret', icon: XCircle, color: 'border-red-300 bg-red-50' },
];

export default function Indkoebsordrer() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSupplier, setFilterSupplier] = useState('all');

  const load = async () => {
    try {
      const [o, s] = await Promise.all([
        base44.entities.PurchaseOrder.list('-created_date', 200),
        base44.entities.Supplier.list(),
      ]);
      setOrders(o); setSuppliers(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => filterSupplier === 'all' || o.supplier_id === filterSupplier);
  const orderTotal = (o) => (o.items || []).reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);

  const moveStatus = async (id, status) => {
    await base44.entities.PurchaseOrder.update(id, { status });
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-amber-500" /> Indkøbsordrer</h1>
          <p className="text-sm text-slate-500 mt-1">Spor materialebestillinger hos leverandører før levering</p>
        </div>
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="Alle leverandører" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle leverandører</SelectItem>
            {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colOrders = filtered.filter((o) => o.status === col.key);
          const colTotal = colOrders.reduce((s, o) => s + orderTotal(o), 0);
          return (
            <div key={col.key} className={`rounded-xl border-2 ${col.color} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <col.icon className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-sm text-slate-700">{col.label}</span>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full">{colOrders.length}</span>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {colOrders.map((o) => {
                  const total = orderTotal(o);
                  const overdue = col.key === 'Bestilt' && o.expected_date && o.expected_date < today;
                  return (
                    <Card key={o.id} className="p-3 bg-white">
                      <div className="font-semibold text-sm text-slate-900">{o.order_number}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{o.supplier_name || '—'}</div>
                      {o.project_name && <div className="text-xs text-slate-400">{o.project_name}</div>}
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Package className="w-3 h-3" />{(o.items || []).length} linjer
                      </div>
                      {o.expected_date && (
                        <div className={`text-xs mt-1 ${overdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                          {overdue ? 'Forsinket: ' : 'Levering: '}{formatDate(o.expected_date)}
                        </div>
                      )}
                      <div className="font-bold text-sm text-slate-900 mt-1">{formatDKK(total)}</div>
                      <div className="flex gap-1 mt-2">
                        {col.key === 'Kladde' && <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => moveStatus(o.id, 'Bestilt')}>Bestil</Button>}
                        {col.key === 'Bestilt' && <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => moveStatus(o.id, 'Modtaget')}>Modtaget</Button>}
                        {(col.key === 'Kladde' || col.key === 'Bestilt') && <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => moveStatus(o.id, 'Annulleret')}>Annuller</Button>}
                      </div>
                    </Card>
                  );
                })}
                {colOrders.length === 0 && <div className="text-center text-xs text-slate-400 py-6">Ingen ordrer</div>}
              </div>
              {colTotal > 0 && <div className="mt-2 pt-2 border-t border-slate-200 text-xs font-medium text-slate-600">{formatDKK(colTotal)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}