import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calcLineTotal, formatDKK } from '@/lib/format';

export default function LineItemEditor({ items = [], onChange }) {
  const update = (index, field, value) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };
  const add = () =>
    onChange([
      ...items,
      { description: '', quantity: 1, unit: 'stk', unit_price: 0 },
    ]);
  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <div className="hidden md:grid grid-cols-12 gap-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        <div className="col-span-5">Beskrivelse</div>
        <div className="col-span-2 text-right">Antal</div>
        <div className="col-span-2">Enhed</div>
        <div className="col-span-2 text-right">Stk. pris</div>
        <div className="col-span-1"></div>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-slate-400 py-4 text-center border border-dashed rounded-lg">
          Ingen linjer endnu. Klik "Tilføj linje".
        </p>
      )}
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <Input
            className="col-span-12 md:col-span-5"
            value={item.description || ''}
            onChange={(e) => update(i, 'description', e.target.value)}
            placeholder="Beskrivelse af arbejde/materialer"
          />
          <Input
            className="col-span-4 md:col-span-2 text-right"
            type="number"
            value={item.quantity ?? ''}
            onChange={(e) => update(i, 'quantity', parseFloat(e.target.value) || 0)}
          />
          <Input
            className="col-span-3 md:col-span-2"
            value={item.unit || ''}
            onChange={(e) => update(i, 'unit', e.target.value)}
            placeholder="stk"
          />
          <Input
            className="col-span-4 md:col-span-2 text-right"
            type="number"
            value={item.unit_price ?? ''}
            onChange={(e) => update(i, 'unit_price', parseFloat(e.target.value) || 0)}
          />
          <div className="col-span-1 flex justify-end">
            <Button variant="ghost" size="icon" type="button" onClick={() => remove(i)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" type="button" onClick={add}>
        <Plus className="w-4 h-4 mr-1.5" /> Tilføj linje
      </Button>
    </div>
  );
}