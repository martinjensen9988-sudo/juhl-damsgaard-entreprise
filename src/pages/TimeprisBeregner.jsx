import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calculator, Clock, Package, Wrench } from 'lucide-react';
import { formatDKK } from '@/lib/format';

const HOURLY_RATE_INCL_VAT = 350; // 350 kr inkl. moms
const HOURLY_RATE_EXCL_VAT = 280; // 280 kr ekskl. moms
const VAT_RATE = 0.25;

const emptyLine = { description: '', quantity: 1, unit: 'stk', unit_price: 0, type: 'material' };

export default function TimeprisBeregner() {
  const [projectName, setProjectName] = useState('');
  const [hours, setHours] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(HOURLY_RATE_INCL_VAT);
  const [materials, setMaterials] = useState([{ description: '', quantity: 1, unit: 'stk', unit_price: 0 }]);
  const [overheadPct, setOverheadPct] = useState(15);
  const [profitPct, setProfitPct] = useState(20);

  const updateMaterial = (i, patch) => setMaterials((s) => s.map((m, idx) => idx === i ? { ...m, ...patch } : m));
  const addMaterial = () => setMaterials((s) => [...s, { ...emptyLine }]);
  const removeMaterial = (i) => setMaterials((s) => s.filter((_, idx) => idx !== i));

  const calc = useMemo(() => {
    const materialsExcl = materials.reduce((s, m) => s + (Number(m.quantity) || 0) * (Number(m.unit_price) || 0), 0);
    const materialsVAT = materialsExcl * VAT_RATE;
    const materialsIncl = materialsExcl + materialsVAT;
    // hours: hourly rate input is inkl. moms
    const laborIncl = (Number(hours) || 0) * (Number(hourlyRate) || 0);
    const laborExcl = laborIncl / (1 + VAT_RATE);
    const laborVAT = laborIncl - laborExcl;
    const subtotalIncl = materialsIncl + laborIncl;
    const subtotalExcl = materialsExcl + laborExcl;
    const overhead = subtotalExcl * (Number(overheadPct) || 0) / 100;
    const profit = subtotalExcl * (Number(profitPct) || 0) / 100;
    const totalExcl = subtotalExcl + overhead + profit;
    const vat = totalExcl * VAT_RATE;
    const totalIncl = totalExcl + vat;
    const costPerHour = (Number(hours) || 0) > 0 ? totalIncl / (Number(hours)) : 0;
    return { materialsExcl, materialsVAT, materialsIncl, laborIncl, laborExcl, laborVAT, subtotalIncl, subtotalExcl, overhead, profit, totalExcl, vat, totalIncl, costPerHour };
  }, [materials, hours, hourlyRate, overheadPct, profitPct]);

  const reset = () => { setProjectName(''); setHours(0); setHourlyRate(HOURLY_RATE_INCL_VAT); setMaterials([{ ...emptyLine }]); setOverheadPct(15); setProfitPct(20); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Calculator className="w-5 h-5 text-amber-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Timepris Beregner</h1>
            <p className="text-slate-500 mt-0.5">Simuler projektpriser baseret på materialer, timer og fast timepris ({HOURLY_RATE_INCL_VAT} kr inkl. moms)</p>
          </div>
        </div>
        <Button variant="outline" onClick={reset}>Nulstil</Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
        Standard timepris: <strong>{HOURLY_RATE_INCL_VAT} kr inkl. moms</strong> ({HOURLY_RATE_EXCL_VAT} kr ekskl. moms) · Moms 25%
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-amber-600" /><h3 className="font-semibold text-slate-900">Timer</h3></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Antal timer</Label><Input type="number" min="0" value={hours} onChange={(e) => setHours(Number(e.target.value) || 0)} /></div>
              <div><Label>Timepris (inkl. moms)</Label><Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value) || 0)} /></div>
            </div>
            <div className="text-sm text-slate-500 mt-2">{hours} t × {formatDKK(hourlyRate)} = <span className="font-semibold text-slate-900">{formatDKK(calc.laborIncl)}</span> inkl. moms</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Package className="w-4 h-4 text-amber-600" /><h3 className="font-semibold text-slate-900">Materialer</h3></div><Button variant="outline" size="sm" onClick={addMaterial}><Plus className="w-3 h-3" /> Tilføj</Button></div>
            <div className="space-y-2">
              {materials.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input className="col-span-5" placeholder="Beskrivelse" value={m.description} onChange={(e) => updateMaterial(i, { description: e.target.value })} />
                  <Input className="col-span-2" type="number" placeholder="Antal" value={m.quantity} onChange={(e) => updateMaterial(i, { quantity: Number(e.target.value) || 0 })} />
                  <Input className="col-span-2" placeholder="Enhed" value={m.unit} onChange={(e) => updateMaterial(i, { unit: e.target.value })} />
                  <Input className="col-span-2" type="number" placeholder="Stk. pris ekskl." value={m.unit_price} onChange={(e) => updateMaterial(i, { unit_price: Number(e.target.value) || 0 })} />
                  <button onClick={() => materials.length > 1 && removeMaterial(i)} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">Materialer i alt: <span className="font-semibold text-slate-900">{formatDKK(calc.materialsIncl)}</span> inkl. moms</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3"><Wrench className="w-4 h-4 text-amber-600" /><h3 className="font-semibold text-slate-900">Pålæg</h3></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Drift/overhead (%)</Label><Input type="number" value={overheadPct} onChange={(e) => setOverheadPct(Number(e.target.value) || 0)} /></div>
              <div><Label>Avance (%)</Label><Input type="number" value={profitPct} onChange={(e) => setProfitPct(Number(e.target.value) || 0)} /></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-4">
            <h3 className="font-semibold text-slate-900 mb-4">Prisberegning</h3>
            <div className="space-y-2.5 text-sm">
              <Row label="Materialer (ekskl.)" value={formatDKK(calc.materialsExcl)} />
              <Row label="Timer (ekskl.)" value={formatDKK(calc.laborExcl)} />
              <div className="border-t border-slate-100 pt-2"><Row label="Subtotal (ekskl.)" value={formatDKK(calc.subtotalExcl)} bold /></div>
              <Row label={`Drift/overhead (${overheadPct}%)`} value={formatDKK(calc.overhead)} />
              <Row label={`Avance (${profitPct}%)`} value={formatDKK(calc.profit)} />
              <div className="border-t border-slate-100 pt-2"><Row label="Total ekskl. moms" value={formatDKK(calc.totalExcl)} bold /></div>
              <Row label="Moms (25%)" value={formatDKK(calc.vat)} />
              <div className="bg-amber-50 rounded-lg p-3 mt-2"><div className="flex items-center justify-between"><span className="font-semibold text-slate-900">Total inkl. moms</span><span className="text-xl font-bold text-amber-700">{formatDKK(calc.totalIncl)}</span></div></div>
              {hours > 0 && <div className="text-xs text-slate-500 mt-2 text-center">Pr. time (inkl. moms): {formatDKK(calc.costPerHour)}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span>
      <span className={bold ? 'font-bold text-slate-900' : 'text-slate-700'}>{value}</span>
    </div>
  );
}