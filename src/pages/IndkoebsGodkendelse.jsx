import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, X, Clock } from 'lucide-react';

export default function IndkoebsGodkendelse() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const all = await base44.entities.PurchaseOrder.list('-order_date', 200).catch(() => []);
    setItems((all || []).filter((o) => o.status === 'Kladde' || o.status === 'Bestilt'));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const approve = async (o) => {
    await base44.entities.PurchaseOrder.update(o.id, { status: 'Bestilt' });
    load();
  };
  const reject = async (o) => {
    await base44.entities.PurchaseOrder.update(o.id, { status: 'Annulleret' });
    load();
  };

  const total = (o) => (o.items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const pending = items.filter((o) => o.status === 'Kladde');
  const approved = items.filter((o) => o.status === 'Bestilt');

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Indkøbsgodkendelse</h1>
        <p className="text-sm text-muted-foreground">Godkend medarbejdernes indkøbsanmodninger før bestilling.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-amber-50 p-3"><div className="text-2xl font-bold text-amber-700">{pending.length}</div><div className="text-xs text-amber-600">Til godkendelse</div></div>
        <div className="rounded-lg border bg-blue-50 p-3"><div className="text-2xl font-bold text-blue-700">{approved.length}</div><div className="text-xs text-blue-600">Godkendt (bestilt)</div></div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Til godkendelse</h3>
        {pending.length === 0 && <p className="text-sm text-muted-foreground">Ingen ventende anmodninger.</p>}
        {pending.map((o) => (
          <div key={o.id} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold">{o.order_number} • {o.supplier_name || '—'}</div>
              <div className="text-xs text-muted-foreground">{o.project_name || '—'} • {o.order_date} • {total(o).toLocaleString('da-DK')} DKK</div>
              {o.items && o.items.length > 0 && <div className="text-xs text-muted-foreground mt-0.5">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</div>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => approve(o)}><Check className="w-4 h-4" /> Godkend</Button>
              <Button size="sm" variant="outline" onClick={() => reject(o)}><X className="w-4 h-4" /> Afvis</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-blue-700">Godkendt (venter levering)</h3>
        {approved.length === 0 && <p className="text-sm text-muted-foreground">Ingen godkendte ordrer.</p>}
        {approved.map((o) => (
          <div key={o.id} className="rounded-lg border bg-card p-3 flex items-center justify-between gap-2">
            <div>
              <div className="font-medium text-sm">{o.order_number} • {o.supplier_name || '—'}</div>
              <div className="text-xs text-muted-foreground">{o.project_name || '—'} • {total(o).toLocaleString('da-DK')} DKK</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Bestilt</span>
          </div>
        ))}
      </div>
    </div>
  );
}