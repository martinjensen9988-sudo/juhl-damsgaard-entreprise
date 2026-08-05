import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format, parseISO, differenceInDays } from 'date-fns';
import { formatDKK } from '@/lib/format';
import { Loader2, Wrench, MapPin, User, CalendarClock, History, Settings2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STATUS_STYLE = {
  Ledig: 'bg-emerald-100 text-emerald-700',
  'I brug': 'bg-blue-100 text-blue-700',
  Repair: 'bg-amber-100 text-amber-700',
  'Ude af drift': 'bg-rose-100 text-rose-700',
};

const COND_STYLE = { God: 'text-emerald-600', Slidt: 'text-amber-600', Defekt: 'text-rose-600' };

export default function VaerktoejLogbog() {
  const [equipment, setEquipment] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [eq, mt, bk] = await Promise.all([
          base44.entities.Equipment.list('-updated_date', 500),
          base44.entities.EquipmentMaintenance.list('-updated_date', 500),
          base44.entities.EquipmentBooking.list('-updated_date', 500),
        ]);
        setEquipment(eq);
        setMaintenance(mt);
        setBookings(bk);
      } catch (e) { console.error(e); }
    })();
  }, []);

  if (!equipment) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const today = new Date();
  const filtered = equipment.filter((e) =>
    !filter || (e.name + (e.serial_number || '') + (e.location || '') + (e.assigned_project_name || '')).toLowerCase().includes(filter.toLowerCase()));

  const eqMaintenance = (name) =>
    maintenance.filter((m) => m.equipment_name === name).sort((a, b) => new Date(b.last_date || 0) - new Date(a.last_date || 0));

  const eqBookings = (name) =>
    bookings.filter((b) => b.equipment_name === name).sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));

  const overdueService = (m) => m.next_date && differenceInDays(parseISO(m.next_date), today) < 0 && m.status !== 'Gennemført';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Værktøjslogbog</h1>
        <p className="text-slate-500 mt-1">Brugshistorik, serviceeftersyn og aktuelle placering af værktøj og maskiner</p>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Søg på navn, serienr, lokation eller projekt..."
        className="w-full sm:max-w-md px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Intet værktøj eller udstyr registreret.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((eq) => {
            const mt = eqMaintenance(eq.name);
            const bk = eqBookings(eq.name);
            const lastService = mt[0];
            const nextService = mt.find((m) => m.next_date && m.status !== 'Gennemført');
            const overdue = nextService && overdueService(nextService);
            return (
              <div key={eq.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-5 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Wrench className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{eq.name}</div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                        {eq.serial_number && <span>Snr: {eq.serial_number}</span>}
                        <span className="text-slate-400">· {eq.category}</span>
                        {eq.condition && <span className={COND_STYLE[eq.condition] || 'text-slate-500'}>· Stand: {eq.condition}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className={`px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[eq.status] || 'bg-slate-100'}`}>{eq.status}</span>
                    {eq.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {eq.location}</span>}
                    {eq.assigned_project_name && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {eq.assigned_project_name}</span>}
                    {nextService && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${overdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                        {overdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}
                        Næste eftersyn: {format(parseISO(nextService.next_date), 'dd.MM.yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 border-t border-slate-100 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  {/* Service history */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
                      <Settings2 className="w-4 h-4 text-slate-400" /> Serviceeftersyn ({mt.length})
                    </div>
                    {mt.length === 0 ? (
                      <div className="text-xs text-slate-400">Intet registreret eftersyn.</div>
                    ) : (
                      <div className="space-y-2">
                        {mt.slice(0, 4).map((m) => (
                          <div key={m.id} className="flex items-start justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <div className="text-slate-700 font-medium">{m.maintenance_type}</div>
                              <div className="text-slate-400">{m.last_date ? format(parseISO(m.last_date), 'dd.MM.yyyy') : '—'} · {m.performed_by || '—'}</div>
                            </div>
                            <div className="text-right shrink-0">
                              {m.cost ? <div className="text-slate-700">{formatDKK(m.cost)}</div> : null}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                m.status === 'Gennemført' ? 'bg-emerald-100 text-emerald-700' :
                                m.status === 'Forsinket' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                              }`}>{m.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Usage history */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
                      <History className="w-4 h-4 text-slate-400" /> Brugshistorik ({bk.length})
                    </div>
                    {bk.length === 0 ? (
                      <div className="text-xs text-slate-400">Ingen bookinger registreret.</div>
                    ) : (
                      <div className="space-y-2">
                        {bk.slice(0, 4).map((b) => (
                          <div key={b.id} className="flex items-start justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <div className="text-slate-700 font-medium truncate">{b.project_name || 'Udlejning'}</div>
                              <div className="text-slate-400">
                                {b.start_date ? format(parseISO(b.start_date), 'dd.MM') : '—'} → {b.end_date ? format(parseISO(b.end_date), 'dd.MM') : '—'}
                                {b.employee_name ? ` · ${b.employee_name}` : ''}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {b.total_price ? <div className="text-slate-700">{formatDKK(b.total_price)}</div> : null}
                              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                b.status === 'Returneret' ? 'bg-emerald-100 text-emerald-700' :
                                b.status === 'Udleveret' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {b.status === 'Returneret' && <CheckCircle2 className="w-3 h-3" />}
                                {b.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}