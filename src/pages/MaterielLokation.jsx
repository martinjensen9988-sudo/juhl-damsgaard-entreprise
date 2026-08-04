import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Package, Boxes, AlertCircle } from 'lucide-react';

const CATEGORY_ICONS = {
  'Maskine': '🚜',
  'Værktøj': '🔧',
  'Køretøj': '🚚',
  'Stillads': '🏗️',
  'Container': '📦',
  'Andet': '⚙️',
};

const STATUS_COLORS = {
  'Ledig': 'border-emerald-300 bg-emerald-50',
  'I brug': 'border-blue-300 bg-blue-50',
  'Reparation': 'border-amber-300 bg-amber-50',
  'Ude af drift': 'border-red-300 bg-red-50',
};
const STATUS_BADGE = {
  'Ledig': 'bg-emerald-100 text-emerald-700',
  'I brug': 'bg-blue-100 text-blue-700',
  'Reparation': 'bg-amber-100 text-amber-700',
  'Ude af drift': 'bg-red-100 text-red-700',
};

const LOCATION_COLORS = [
  'from-slate-600 to-slate-800',
  'from-amber-600 to-amber-800',
  'from-blue-600 to-blue-800',
  'from-emerald-600 to-emerald-800',
  'from-purple-600 to-purple-800',
  'from-rose-600 to-rose-800',
  'from-cyan-600 to-cyan-800',
  'from-indigo-600 to-indigo-800',
];

export default function MaterielLokation() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Equipment.list('-created_date', 500);
        setEquipment(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return equipment.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (catFilter !== 'all' && e.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.name} ${e.serial_number || ''} ${e.location || ''} ${e.assigned_to || ''} ${e.assigned_project_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [equipment, search, statusFilter, catFilter]);

  // Group by location
  const locations = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      const key = (e.location && e.location.trim()) || 'Ikke tildelt lokation';
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const locColor = (i) => LOCATION_COLORS[i % LOCATION_COLORS.length];

  const totalItems = filtered.length;
  const inUse = filtered.filter((e) => e.status === 'I brug').length;
  const available = filtered.filter((e) => e.status === 'Ledig').length;
  const noLocation = equipment.filter((e) => !e.location || !e.location.trim()).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <MapPin className="w-7 h-7 text-amber-500" /> Materiellokationer
        </h1>
        <p className="text-slate-500 mt-1">Visuelt overblik over hvor alt materiel befinder sig</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Boxes} label="Lokationer" value={locations.length} color="text-slate-700" />
        <Stat icon={Package} label="Materiel i alt" value={totalItems} color="text-blue-600" />
        <Stat icon={Package} label="I brug" value={inUse} color="text-amber-600" />
        <Stat icon={Package} label="Ledigt" value={available} color="text-emerald-600" />
      </div>

      {noLocation > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {noLocation} materiel mangler tildelt lokation
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Søg materiel, serienr, projekt..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="sm:w-48 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {Object.keys(CATEGORY_ICONS).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statusser</SelectItem>
            <SelectItem value="Ledig">Ledig</SelectItem>
            <SelectItem value="I brug">I brug</SelectItem>
            <SelectItem value="Reparation">Reparation</SelectItem>
            <SelectItem value="Ude af drift">Ude af drift</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">Intet material fundet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {locations.map(([loc, items], idx) => (
            <div key={loc} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <div className={`bg-gradient-to-r ${locColor(idx)} px-4 py-3 flex items-center justify-between text-white`}>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-5 h-5 shrink-0" />
                  <h2 className="font-semibold truncate">{loc}</h2>
                </div>
                <span className="text-2xl font-bold tabular-nums shrink-0 ml-2">{items.length}</span>
              </div>
              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {items.map((e) => (
                  <div key={e.id} className={`flex items-start gap-2 rounded-lg border ${STATUS_COLORS[e.status] || 'border-slate-200 bg-slate-50'} px-3 py-2`}>
                    <span className="text-lg leading-none mt-0.5">{CATEGORY_ICONS[e.category] || '⚙️'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 text-sm truncate">{e.name}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_BADGE[e.status]}`}>{e.status}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                        {e.assigned_project_name && <div>📍 {e.assigned_project_name}</div>}
                        {e.assigned_to && <div>👤 {e.assigned_to}</div>}
                        {e.serial_number && <div className="text-slate-400">SN: {e.serial_number}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase"><Icon className="w-4 h-4" /> {label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}