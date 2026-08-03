import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CalendarRange, ChevronLeft, ChevronRight, Users, Wrench, HardHat, MapPin,
} from 'lucide-react';
import { formatDate } from '@/lib/format';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Mandag som første dag
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISO(d) { return d.toISOString().split('T')[0]; }

const dayNames = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

export default function RessourcePlanlaegning() {
  const [weekStart, setWeekStart] = useState(toISO(startOfWeek(new Date())));
  const [assignments, setAssignments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all'); // all | people | equipment

  const load = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        base44.entities.Assignment.list('', 500),
        base44.entities.EquipmentBooking.list('', 500),
      ]);
      setAssignments(a || []);
      setBookings(b || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const start = new Date(weekStart);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [weekStart]);

  const weekEnd = toISO(days[6]);

  // Filter to current week
  const weekAssignments = useMemo(
    () => assignments.filter((a) => a.date >= toISO(days[0]) && a.date <= weekEnd),
    [assignments, weekStart]
  );
  const weekBookings = useMemo(
    () => bookings.filter((b) => {
      const s = b.start_date || '';
      const e = b.end_date || '';
      return e >= toISO(days[0]) && s <= weekEnd;
    }),
    [bookings, weekStart]
  );

  // Unique people and equipment this week
  const people = useMemo(() => {
    const names = [...new Set(weekAssignments.map((a) => a.employee_name).filter(Boolean))];
    return names.sort();
  }, [weekAssignments]);
  const equipment = useMemo(() => {
    const names = [...new Set(weekBookings.map((b) => b.equipment_name).filter(Boolean))];
    return names.sort();
  }, [weekBookings]);

  const getAssignmentsForDay = (name, day) =>
    weekAssignments.filter((a) => a.employee_name === name && a.date === day);
  const getBookingsForDay = (name, day) =>
    weekBookings.filter((b) => b.equipment_name === name && b.start_date <= day && b.end_date >= day);

  const prevWeek = () => setWeekStart(toISO(addDays(start, -7)));
  const nextWeek = () => setWeekStart(toISO(addDays(start, 7)));
  const thisWeek = () => setWeekStart(toISO(startOfWeek(new Date())));

  const today = toISO(new Date());
  const showPeople = view === 'all' || view === 'people';
  const showEquipment = view === 'all' || view === 'equipment';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center"><CalendarRange className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Ressourceplanlægning</h1>
            <p className="text-slate-500 mt-0.5">Hvem og hvilket materiel der er booket til projekter — samlet i en ugekalender</p>
          </div>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="text-sm font-medium text-slate-700 px-2">
          Uge {Math.ceil((days[3].getDate() + 1) / 7)} · {formatDate(toISO(days[0]))} – {formatDate(weekEnd)}
        </div>
        <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
        <Button variant="outline" size="sm" onClick={thisWeek}>Denne uge</Button>
        <div className="ml-auto">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Personer & materiel</SelectItem>
              <SelectItem value="people">Kun personer</SelectItem>
              <SelectItem value="equipment">Kun materiel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><HardHat className="w-3.5 h-3.5" /> {people.length} personer booket</span>
        <span className="flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> {equipment.length} materiel booket</span>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser…</div> : people.length === 0 && equipment.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><CalendarRange className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen bookinger denne uge</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header row */}
            <div className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50">
              <div className="p-3 text-xs font-medium text-slate-500">Ressource</div>
              {days.map((d) => {
                const isToday = toISO(d) === today;
                return (
                  <div key={toISO(d)} className={`p-3 text-center border-l border-slate-200 ${isToday ? 'bg-blue-50' : ''}`}>
                    <div className="text-xs text-slate-500">{dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1]}</div>
                    <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {/* People rows */}
            {showPeople && people.map((name) => (
              <div key={`p-${name}`} className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-slate-100">
                <div className="p-3 flex items-center gap-2 bg-slate-50/50 border-r border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Users className="w-3.5 h-3.5 text-blue-600" /></div>
                  <span className="text-sm font-medium text-slate-700 truncate">{name}</span>
                </div>
                {days.map((d) => {
                  const dayAssignments = getAssignmentsForDay(name, toISO(d));
                  return (
                    <div key={toISO(d)} className="p-2 border-l border-slate-100 min-h-[60px] space-y-1">
                      {dayAssignments.map((a) => (
                        <div key={a.id} className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5">
                          <div className="text-xs font-medium text-blue-900 truncate">{a.project_name || 'Ukendt projekt'}</div>
                          {a.notes && <div className="text-[10px] text-blue-600 truncate">{a.notes}</div>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Equipment rows */}
            {showEquipment && equipment.map((name) => (
              <div key={`e-${name}`} className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-slate-100">
                <div className="p-3 flex items-center gap-2 bg-slate-50/50 border-r border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Wrench className="w-3.5 h-3.5 text-amber-600" /></div>
                  <span className="text-sm font-medium text-slate-700 truncate">{name}</span>
                </div>
                {days.map((d) => {
                  const dayBookings = getBookingsForDay(name, toISO(d));
                  return (
                    <div key={toISO(d)} className="p-2 border-l border-slate-100 min-h-[60px] space-y-1">
                      {dayBookings.map((b) => (
                        <div key={b.id} className="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                          <div className="text-xs font-medium text-amber-900 truncate">{b.project_name || 'Booket'}</div>
                          {b.employee_name && <div className="text-[10px] text-amber-600 truncate"><MapPin className="w-2.5 h-2.5 inline mr-0.5" />{b.employee_name}</div>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}