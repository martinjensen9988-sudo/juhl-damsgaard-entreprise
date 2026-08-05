import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, AlertTriangle, TrendingDown, Boxes, Minus, Plus, Pencil } from 'lucide-react';
import { formatDKK } from '@/lib/format';

export default function LagerStatus() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustValue, setAdjustValue] = useState('');

  async function load() {
    setLoading(true);
    try {
      setItems(await base44.entities.InventoryItem.list('-created_date', 300));
    } catch (e) { toast({ title: 'Fejl', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const critical = items.filter((i) => Number(i.stock_quantity) <= Number(i.min_stock_level || 0));
  const totalValue = items.reduce((s, i) => s + (Number(i.stock_quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const totalUnits = items.reduce((s, i) => s + (Number(i.stock_quantity) || 0), 0);

  async function saveAdjust() {
    if (!adjustItem) return;
    const delta = Number(adjustValue);
    if (isNaN(delta) || delta === 0) { toast({ title: 'Indtast et tal', variant: 'destructive' }); return; }
    const newQty = Math.max(0, (Number(adjustItem.stock_quantity) || 0) + delta);
    try {
      await base44.entities.InventoryItem.update(adjustItem.id, { stock_quantity: newQty });
      toast({ title: 'Beholdning justeret', description: `${adjustItem.name}: ${newQty} ${adjustItem.unit || 'stk'}` });
      setAdjustItem(null); setAdjustValue('');
      load();
    } catch (err) { toast({ title: 'Fejl', description: err.message, variant: 'destructive' }); }
  }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Lagerstatus</h1>
        <p className="text-slate-500 mt-1">Visuelt overblik over lageret — kritiske lagerniveauer og manuel justering</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><Boxes className="w-4 h-4" /> Varelinjer</div><div className="text-2xl font-bold mt-1">{items.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><Package className="w-4 h-4" /> Total enheder</div><div className="text-2xl font-bold mt-1">{totalUnits.toLocaleString('da-DK')}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><TrendingDown className="w-4 h-4" /> Lagerværdi</div><div className="text-2xl font-bold mt-1">{formatDKK(totalValue)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-red-500 text-sm"><AlertTriangle className="w-4 h-4" /> Kritiske</div><div className="text-2xl font-bold mt-1 text-red-600">{critical.length}</div></CardContent></Card>
      </div>

      {critical.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader><CardTitle className="flex items-center gap-2 text-red-700"><AlertTriangle className="w-5 h-5" /> Kritiske lagerniveauer</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {critical.map((i) => (
                <div key={i.id} className="bg-white rounded-lg p-3 border border-red-100 flex items-center justify-between">
                  <div><div className="font-medium text-slate-900">{i.name}</div><div className="text-xs text-red-600">{i.stock_quantity} {i.unit} / min {i.min_stock_level} {i.unit}</div></div>
                  <Button size="sm" variant="outline" onClick={() => { setAdjustItem(i); setAdjustValue(''); }}><Pencil className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Samlet lagerbeholdning</CardTitle></CardHeader>
        <CardContent>
          {items.length === 0 ? <div className="text-center py-12 text-slate-400">Lageret er tomt</div> : (
            <div className="space-y-2">
              {items.map((i) => {
                const ratio = i.min_stock_level > 0 ? (Number(i.stock_quantity) || 0) / i.min_stock_level : 2;
                const barColor = ratio <= 1 ? 'bg-red-500' : ratio <= 1.5 ? 'bg-amber-500' : 'bg-emerald-500';
                const pct = Math.min(100, ratio <= 1 ? ratio * 50 + 10 : 70);
                return (
                  <div key={i.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 truncate">{i.name}</span>
                        <span className="text-sm text-slate-600 ml-2">{Number(i.stock_quantity) || 0} {i.unit || 'stk'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">min {i.min_stock_level || 0}</span>
                        {i.location && <span className="text-xs text-slate-400">{i.location}</span>}
                        <Button size="sm" variant="ghost" onClick={() => { setAdjustItem(i); setAdjustValue(''); }}><Pencil className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!adjustItem} onOpenChange={(o) => !o && setAdjustItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Juster beholdning</DialogTitle></DialogHeader>
          {adjustItem && (
            <div className="space-y-3">
              <div className="text-sm text-slate-600">{adjustItem.name}</div>
              <div className="text-sm">Nuværende: <span className="font-medium">{adjustItem.stock_quantity} {adjustItem.unit || 'stk'}</span></div>
              <div><Label>Justering (± antal)</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setAdjustValue(String((Number(adjustValue) || 0) - 1))}><Minus className="w-4 h-4" /></Button>
                  <Input type="number" value={adjustValue} onChange={(e) => setAdjustValue(e.target.value)} placeholder="f.eks. 5 eller -3" />
                  <Button variant="outline" size="icon" onClick={() => setAdjustValue(String((Number(adjustValue) || 0) + 1))}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="text-xs text-slate-500">Ny beholdning: {Math.max(0, (Number(adjustItem.stock_quantity) || 0) + (Number(adjustValue) || 0))} {adjustItem.unit || 'stk'}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustItem(null)}>Annuller</Button>
            <Button onClick={saveAdjust}>Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}