import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wrench, MapPin, Calendar, User, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/format';

const STATUS_BADGE = { Ledig: 'secondary', 'I brug': 'default', Reparation: 'destructive', 'Ude af drift': 'destructive' };

export default function VaerktoejListe() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [tools, maint] = await Promise.all([
          base44.entities.Equipment.list('-created_date', 300),
          base44.entities.EquipmentMaintenance.list('-created_date', 200),
        ]);
        setItems(tools); setMaintenance(maint);
      } catch (e) { toast({ title: 'Fejl', description: e.message, variant: 'destructive' }); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = items
    .filter((t) => filter === 'all' || t.category === filter)
    .filter((t) => !search || (t.name || '').toLowerCase().includes(search.toLowerCase()) || (t.serial_number || '').toLowerCase().includes(search.toLowerCase()));

  function nextService(tool) {
    const ms = maintenance.filter((m) => m.equipment_name === tool.name);
    if (ms.length === 0) return null;
    return ms.sort((a, b) => new Date(b.next_date || 0) - new Date(a.next_date || 0))[0];
  }

  function lastUser(tool) {
    return tool.assigned_to || tool.assigned_project_name || '—';
  }

  const dueSoon = filtered.filter((t) => {
    const ns = nextService(t);
    if (!ns?.next_date) return false;
    const d = new Date(ns.next_date);
    const days = (d - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 14;
  }).length;

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Værktøjsliste</h1>
        <p className="text-slate-500 mt-1">Oversigt over firmaets værktøjspark — placering, serviceintervaller og seneste bruger</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-slate-500">Samlet værktøj</div><div className="text-2xl font-bold">{items.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-slate-500">I brug</div><div className="text-2xl font-bold text-blue-600">{items.filter((t) => t.status === 'I brug').length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-slate-500">Service snart</div><div className="text-2xl font-bold text-amber-600 flex items-center gap-1">{dueSoon}<AlertTriangle className="w-5 h-5" /></div></CardContent></Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Søg navn eller serienr…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            <SelectItem value="Værktøj">Værktøj</SelectItem>
            <SelectItem value="Maskine">Maskine</SelectItem>
            <SelectItem value="Køretøj">Køretøj</SelectItem>
            <SelectItem value="Stillads">Stillads</SelectItem>
            <SelectItem value="Container">Container</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400">Intet værktøj fundet</div>}
        {filtered.map((t) => {
          const ns = nextService(t);
          const due = ns?.next_date ? (new Date(ns.next_date) - new Date()) / (1000 * 60 * 60 * 24) <= 14 : false;
          return (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Wrench className="w-5 h-5 text-slate-600" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{t.name}</span>
                        <Badge variant={STATUS_BADGE[t.status] || 'secondary'}>{t.status}</Badge>
                        {t.condition && <Badge variant="outline">{t.condition}</Badge>}
                      </div>
                      {t.serial_number && <div className="text-xs text-slate-500 mt-0.5">S/N: {t.serial_number}</div>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.location || '—'}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{lastUser(t)}</span>
                        {ns?.next_date && <span className={`flex items-center gap-1 ${due ? 'text-amber-600 font-medium' : ''}`}><Calendar className="w-3 h-3" />Næste service: {formatDate(ns.next_date)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}