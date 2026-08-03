import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDKK, calcSubtotal, calcVAT, calcTotal } from '@/lib/format';
import { SERVICE_CATEGORIES } from '@/lib/pricing';
import { Calculator, Plus, Trash2, RotateCcw } from 'lucide-react';

export default function Prisberegner() {
  const [items, setItems] = useState([]);

  const addService = (svc) => {
    const existing = items.find((i) => i.name === svc.name);
    if (existing) {
      setItems(items.map((i) => i.name === svc.name ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { ...svc, unit_price: svc.price, quantity: 1 }]);
    }
  };

  const updateQty = (idx, qty) => {
    const next = [...items];
    next[idx] = { ...next[idx], quantity: Math.max(0, Number(qty) || 0) };
    setItems(next.filter((i) => i.quantity > 0));
  };

  const updatePrice = (idx, price) => {
    const next = [...items];
    next[idx] = { ...next[idx], unit_price: Number(price) || 0 };
    setItems(next);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const reset = () => setItems([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Prisberegner</h1>
        <p className="text-slate-500 mt-1">Få et vejledende estimat på dit projekt</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Service picker */}
        <div className="lg:col-span-2 space-y-4">
          {SERVICE_CATEGORIES.map((cat) => (
            <div key={cat.category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-semibold text-slate-900 text-sm">
                {cat.category}
              </div>
              <div className="divide-y divide-slate-50">
                {cat.services.map((svc) => {
                  const selected = items.find((i) => i.name === svc.name);
                  return (
                    <div key={svc.name} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">{svc.name}</div>
                        <div className="text-xs text-slate-500">per {svc.unit} · {formatDKK(svc.price)}</div>
                      </div>
                      {selected ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={selected.quantity}
                            onChange={(e) => updateQty(items.findIndex((i) => i.name === svc.name), e.target.value)}
                            className="w-20 text-right text-sm"
                          />
                          <span className="text-xs text-slate-500 w-6">{svc.unit}</span>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => addService(svc)}>
                          <Plus className="w-3.5 h-3.5" /> Tilføj
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-4 h-fit">
          <div className="bg-slate-950 text-white rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">Dit estimat</h3>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                Vælg ydelser fra listen for at beregne din pris.
              </p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-200 truncate">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.quantity} {item.unit} × {formatDKK(item.unit_price)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatDKK(item.quantity * item.unit_price)}</div>
                        <button onClick={() => removeItem(i)} className="text-xs text-slate-500 hover:text-red-400">
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-700 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Subtotal</span>
                    <span>{formatDKK(calcSubtotal(items))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Moms (25%)</span>
                    <span>{formatDKK(calcVAT(calcSubtotal(items)))}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
                    <span>Total</span>
                    <span className="text-amber-400">{formatDKK(calcTotal(items))}</span>
                  </div>
                </div>

                <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                  <RotateCcw className="w-3 h-3" /> Nulstil
                </button>
              </>
            )}

            <p className="text-xs text-slate-500 pt-2 border-t border-slate-700">
              Dette er et uforpligtende overslag. Kontakt os for et endeligt tilbud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}