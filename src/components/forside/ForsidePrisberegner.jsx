import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDKK, calcSubtotal, calcVAT, calcTotal } from '@/lib/format';
import { SERVICE_CATEGORIES, PAINT_MATERIALS, PAINT_COVERAGE_M2_PER_LITER } from '@/lib/pricing';
import { Calculator, Plus, RotateCcw, ArrowRight, ChevronDown, Trash2 } from 'lucide-react';

const paintLiters = (m2) => Math.max(0, Math.ceil((Number(m2) || 0) / PAINT_COVERAGE_M2_PER_LITER));

export default function ForsidePrisberegner() {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState('Gravearbejde');
  const navigate = useNavigate();

  const addService = (svc) => {
    const existing = items.find((i) => i.name === svc.name);
    if (existing) {
      const next = items.map((i) => i.name === svc.name ? { ...i, quantity: i.quantity + 1 } : i);
      if (svc.paint) {
        const mat = PAINT_MATERIALS[svc.paint];
        const liters = paintLiters(existing.quantity + 1);
        const matIdx = next.findIndex((i) => i.linkedTo === svc.name);
        if (matIdx >= 0) next[matIdx] = { ...next[matIdx], quantity: liters };
        else next.push({ name: mat.materialName, unit: 'liter', unit_price: mat.pricePerLiter, quantity: liters, linkedTo: svc.name, isPaintMaterial: true });
      }
      setItems(next);
    } else {
      const next = [...items, { ...svc, quantity: 1 }];
      if (svc.paint) {
        const mat = PAINT_MATERIALS[svc.paint];
        next.push({ name: mat.materialName, unit: 'liter', unit_price: mat.pricePerLiter, quantity: paintLiters(1), linkedTo: svc.name, isPaintMaterial: true });
      }
      setItems(next);
    }
  };

  const updateQty = (idx, qty) => {
    const next = [...items];
    const item = next[idx];
    const newQty = Math.max(0, Number(qty) || 0);
    next[idx] = { ...item, quantity: newQty };
    if (item.paint) {
      const matIdx = next.findIndex((i) => i.linkedTo === item.name);
      if (matIdx >= 0) {
        if (newQty === 0) next.splice(matIdx, 1);
        else next[matIdx] = { ...next[matIdx], quantity: paintLiters(newQty) };
      }
    }
    setItems(next.filter((i) => i.quantity > 0));
  };

  const removeItem = (idx) => {
    const item = items[idx];
    const next = items.filter((_, i) => i !== idx);
    if (item.paint) {
      const filtered = next.filter((i) => i.linkedTo !== item.name);
      setItems(filtered);
    } else if (item.isPaintMaterial) {
      // også fjerne den tilknyttede maleservice
      setItems(next.filter((i) => i.name !== item.linkedTo));
    } else {
      setItems(next);
    }
  };
  const reset = () => setItems([]);
  const subtotal = calcSubtotal(items);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-3">
        {SERVICE_CATEGORIES.map((cat) => (
          <div key={cat.category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === cat.category ? null : cat.category)}
              className="w-full px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between font-semibold text-slate-900 text-sm hover:bg-slate-100 transition"
            >
              {cat.category}
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded === cat.category ? 'rotate-180' : ''}`} />
            </button>
            {expanded === cat.category && (
              <div className="divide-y divide-slate-50">
                {cat.services.map((svc) => {
                  const selected = items.find((i) => i.name === svc.name);
                  return (
                    <div key={svc.name} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">{svc.name}</div>
                        <div className="text-xs text-slate-500">per {svc.unit} · {formatDKK(svc.price)}</div>
                      </div>
                      {selected ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={selected.quantity}
                            onChange={(e) => updateQty(items.findIndex((i) => i.name === svc.name), e.target.value)}
                            className="w-20 text-right text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <span className="text-xs text-slate-500 w-6">{svc.unit}</span>
                        </div>
                      ) : (
                        <button onClick={() => addService(svc)} className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Tilføj
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="lg:col-span-2">
        <div className="bg-slate-950 text-white rounded-2xl p-6 lg:sticky lg:top-24 border border-slate-800">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-semibold text-lg">Dit estimat</h3>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-slate-400">
                Vælg ydelser fra kategorierne for at beregne din pris.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-72 overflow-y-auto mb-4 pr-1">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-sm group">
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.quantity} {item.unit} × {formatDKK(item.unit_price)}</div>
                    </div>
                    <div className="text-right flex items-start gap-2">
                      <div>
                        <div className="font-medium">{formatDKK(item.quantity * item.unit_price)}</div>
                      </div>
                      <button onClick={() => removeItem(i)} className="text-slate-600 hover:text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Subtotal</span>
                  <span>{formatDKK(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Moms (25%)</span>
                  <span>{formatDKK(calcVAT(subtotal))}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t border-slate-700">
                  <span>Total</span>
                  <span className="text-amber-400">{formatDKK(calcTotal(items))}</span>
                </div>
              </div>

              <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mt-3 transition">
                <RotateCcw className="w-3 h-3" /> Nulstil
              </button>
            </>
          )}

          <button onClick={() => items.length > 0 && navigate('/forespoergsel', { state: { items, source: 'Prisberegner' } })} disabled={items.length === 0} className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-semibold hover:bg-amber-300 transition disabled:opacity-50">
            Send forespørgsel <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
            Uforpligtende overslag. Kontakt os for et endeligt og bindende tilbud.
          </p>
        </div>
      </div>
    </div>
  );
}