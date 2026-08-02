import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Truck, Mail, Phone, MapPin, FileText, Calendar } from 'lucide-react';

const CATEGORIES = ['Byggematerialer', 'Maskiner', 'Transport', 'Værktøj', 'Andet'];

export default function Leverandoeroversigt() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Supplier.list('-created_date', 300);
      setSuppliers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filterCat === 'all' ? suppliers : suppliers.filter((s) => s.category === filterCat);
  const grouped = CATEGORIES.map((c) => ({ c, items: filtered.filter((s) => s.category === c) })).filter((g) => g.items.length > 0);

  const openHistory = (s) => {
    setEditing(s);
    setForm({ notes: s.notes || '' });
  };

  const saveHistory = async () => {
    setSaving(true);
    try {
      await base44.entities.Supplier.update(editing.id, { notes: form.notes });
      setEditing(null);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Leverandøroversigt</h1>
        <p className="text-slate-500 mt-1">Kontaktoplysninger, varegrupper og samarbejdshistorik</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">{suppliers.length}</div>
          <div className="text-xs text-slate-500">Leverandører i alt</div>
        </div>
        {CATEGORIES.map((c) => (
          <div key={c} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{suppliers.filter((s) => s.category === c).length}</div>
            <div className="text-xs text-slate-500">{c}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm text-slate-600">Varegruppe:</Label>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle varegrupper</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen leverandører fundet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.c}>
              <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {g.c} <span className="text-slate-400 font-normal">({g.items.length})</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.items.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="font-semibold text-slate-900 truncate">{s.name}</div>
                    {s.contact_person && <div className="text-sm text-slate-500">{s.contact_person}</div>}
                    <div className="space-y-1 text-sm text-slate-600 mt-2">
                      {s.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}</div>}
                      {s.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}</div>}
                      {(s.address || s.city) && (
                        <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{[s.address, [s.postal_code, s.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {s.cvr && <div className="text-xs text-slate-400">CVR: {s.cvr}</div>}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {s.created_date ? new Date(s.created_date).toLocaleDateString('da-DK') : '–'}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => openHistory(s)}>
                        <FileText className="w-3.5 h-3.5 mr-1" /> Historik
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Samarbejdshistorik – {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Historik & noter</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ notes: e.target.value })} rows={6}
              placeholder="F.eks. fast leverandør siden 2022, rabataftale, tidligere problemer mv." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Luk</Button>
            <Button onClick={saveHistory} disabled={saving}>{saving ? 'Gemmer...' : 'Gem historik'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}