import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ruler, Layers, Plus, Trash2, Save } from 'lucide-react';
import { formatDKK } from '@/lib/format';

const ISOLATION_PRICES = {
  'Rockwool': { materialPerM: 45, arbejdePerM: 95 },
  'PUR skum': { materialPerM: 120, arbejdePerM: 180 },
  'Armaflex': { materialPerM: 85, arbejdePerM: 140 },
  'Mineraluld (teknisk)': { materialPerM: 55, arbejdePerM: 100 },
};

const PIPE_NOMINAL = [
  { label: 'DN15 (21,3 mm)', diameter: 21.3 },
  { label: 'DN20 (26,9 mm)', diameter: 26.9 },
  { label: 'DN25 (33,7 mm)', diameter: 33.7 },
  { label: 'DN32 (42,4 mm)', diameter: 42.4 },
  { label: 'DN40 (48,3 mm)', diameter: 48.3 },
  { label: 'DN50 (60,3 mm)', diameter: 60.3 },
  { label: 'DN65 (76,1 mm)', diameter: 76.1 },
  { label: 'DN80 (88,9 mm)', diameter: 88.9 },
  { label: 'DN100 (114,3 mm)', diameter: 114.3 },
];

export default function TekniskIsoleringBeregner() {
  const { toast } = useToast();
  const [rows, setRows] = useState([
    { pipe: 'DN25 (33,7 mm)', diameter: 33.7, thickness: 30, material: 'Rockwool', length: 10, unit: 'm' },
  ]);
  const [saving, setSaving] = useState(false);

  function updateRow(i, patch) {
    setRows((rs) => rs.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, ...patch };
      if (patch.pipe) {
        const p = PIPE_NOMINAL.find((x) => x.label === patch.pipe);
        if (p) next.diameter = p.diameter;
      }
      return next;
    }));
  }

  function addRow() {
    setRows((rs) => [...rs, { pipe: 'DN25 (33,7 mm)', diameter: 33.7, thickness: 30, material: 'Rockwool', length: 5, unit: 'm' }]);
  }

  function removeRow(i) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }

  const computed = useMemo(() => rows.map((r) => {
    const prices = ISOLATION_PRICES[r.material] || ISOLATION_PRICES['Rockwool'];
    const d = Number(r.diameter) || 0;
    const t = Number(r.thickness) || 0;
    const len = Number(r.length) || 0;
    const circumference = Math.PI * (d + 2 * t) / 1000;
    const area = circumference * len;
    const materialPrice = prices.materialPerM * len;
    const arbejdePrice = prices.arbejdePerM * len;
    const lt = materialPrice + arbejdePrice;
    return { ...r, area: Math.round(area * 100) / 100, unitPrice: len > 0 ? Math.round(lt / len) : 0, lineTotal: Math.round(lt) };
  }), [rows]);

  const subtotal = computed.reduce((s, r) => s + r.lineTotal, 0);
  const moms = Math.round(subtotal * 0.25);
  const total = subtotal + moms;

  async function saveAsQuote() {
    setSaving(true);
    try {
      const year = new Date().getFullYear();
      const count = await base44.entities.Quote.list('-created_date', 200);
      const seq = (count.length || 0) + 1;
      const quoteNumber = `TIL-${year}-${String(seq).padStart(4, '0')}`;
      const line_items = computed.map((r) => ({
        description: `Teknisk isolering ${r.pipe} — ${r.material}, ${r.thickness}mm`,
        quantity: r.length,
        unit: 'm',
        unit_price: r.unitPrice,
      }));
      await base44.entities.Quote.create({
        quote_number: quoteNumber,
        status: 'Kladde',
        date: new Date().toISOString().slice(0, 10),
        line_items,
        notes: `Teknisk isolering — ${computed.length} linjer`,
      });
      toast({ title: 'Tilbud oprettet', description: quoteNumber });
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Teknisk Isolering Beregner</h1>
        <p className="text-slate-500 mt-1">Indtast rørdimensioner og isoleringstykkelse — få korrekte enheder og priser direkte i tilbuddet</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Ruler className="w-5 h-5 text-amber-600" /> Isoleringslinjer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {computed.map((r, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end p-3 bg-slate-50 rounded-lg">
              <div className="col-span-2 md:col-span-1">
                <Label className="text-xs">Rørdimension</Label>
                <Select value={r.pipe} onValueChange={(v) => updateRow(i, { pipe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PIPE_NOMINAL.map((p) => <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ø-yd. (mm)</Label>
                <Input type="number" value={r.diameter} onChange={(e) => updateRow(i, { diameter: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Isolering (mm)</Label>
                <Input type="number" value={r.thickness} onChange={(e) => updateRow(i, { thickness: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Materiale</Label>
                <Select value={r.material} onValueChange={(v) => updateRow(i, { material: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(ISOLATION_PRICES).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Længde (m)</Label>
                <Input type="number" value={r.length} onChange={(e) => updateRow(i, { length: e.target.value })} />
              </div>
              <div className="text-right">
                <Label className="text-xs">Areal (m²)</Label>
                <div className="text-sm font-medium pt-2">{r.area}</div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-2">
                <div className="text-sm font-semibold">{formatDKK(r.lineTotal)}</div>
                <Button variant="ghost" size="icon" onClick={() => removeRow(i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addRow}><Plus className="w-4 h-4 mr-1" /> Tilføj linje</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-emerald-600" /> Prisoverslag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs ml-auto text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal ekskl. moms</span><span className="font-medium">{formatDKK(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Moms (25%)</span><span className="font-medium">{formatDKK(moms)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>{formatDKK(total)}</span></div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={saveAsQuote} disabled={saving || computed.length === 0}>
              <Save className="w-4 h-4 mr-2" /> Gem som tilbud
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}