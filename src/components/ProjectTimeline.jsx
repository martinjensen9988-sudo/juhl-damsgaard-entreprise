import { formatDate } from '@/lib/format';
import { Calendar } from 'lucide-react';

const STATUS_BAR = {
  'I gang': 'bg-blue-500',
  'Planlægning': 'bg-amber-400',
  'Afsluttet': 'bg-emerald-500',
  'På hold': 'bg-slate-400',
};

export default function ProjectTimeline({ projects }) {
  const withDates = projects
    .filter((p) => {
      if (!p.start_date || !p.end_date) return false;
      const s = new Date(p.start_date);
      const e = new Date(p.end_date);
      return !isNaN(s.getTime()) && !isNaN(e.getTime());
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  if (withDates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Calendar className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Projekt Tidslinje</h2>
        </div>
        <div className="px-5 py-12 text-center text-sm text-slate-400">
          Tilføj start- og slutdatoer til dine projekter for at se tidslinjen.
        </div>
      </div>
    );
  }

  const dates = withDates.flatMap((p) => [new Date(p.start_date), new Date(p.end_date)]);
  const minDate = new Date(Math.min(...dates).getTime() - 86400000);
  const maxDate = new Date(Math.max(...dates).getTime() + 86400000);
  const totalRange = maxDate.getTime() - minDate.getTime();

  const today = new Date();
  const todayPct =
    today >= minDate && today <= maxDate
      ? ((today.getTime() - minDate.getTime()) / totalRange) * 100
      : null;

  // Month markers
  const months = [];
  let cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cursor <= maxDate) {
    const ms = new Date(cursor);
    const me = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    const left = ((Math.max(ms.getTime(), minDate.getTime()) - minDate.getTime()) / totalRange) * 100;
    const width = ((Math.min(me.getTime(), maxDate.getTime()) - Math.max(ms.getTime(), minDate.getTime())) / totalRange) * 100;
    months.push({ label: cursor.toLocaleDateString('da-DK', { month: 'short', year: '2-digit' }), left, width });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  const posFor = (dateStr) => ((new Date(dateStr).getTime() - minDate.getTime()) / totalRange) * 100;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Projekt Tidslinje</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> I gang</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Planlægning</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Afsluttet</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-400"></span> På hold</span>
          <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-red-500"></span> I dag</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="relative min-w-[640px]">
          {/* Today marker */}
          {todayPct !== null && (
            <div
              className="absolute top-8 bottom-0 w-0.5 bg-red-400 z-10 pointer-events-none"
              style={{ left: `calc(12rem + (100% - 12rem) * ${todayPct / 100})` }}
            >
              <span className="absolute -top-0 -translate-y-full left-1/2 -translate-x-1/2 text-[10px] font-semibold text-red-500 whitespace-nowrap bg-white px-1 rounded">
                I dag
              </span>
            </div>
          )}

          {/* Month header */}
          <div className="flex h-8 border-b border-slate-100">
            <div className="w-48 shrink-0 bg-slate-50/50 border-r border-slate-100" />
            <div className="flex-1 relative">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex items-center pl-2 text-xs font-medium text-slate-500 border-l border-slate-100"
                  style={{ left: `${m.left}%`, width: `${m.width}%` }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {withDates.map((p) => {
            const left = posFor(p.start_date);
            const width = Math.max(posFor(p.end_date) - left, 0.5);
            const barColor = STATUS_BAR[p.status] || 'bg-slate-400';
            const isPast = new Date(p.end_date) < today;
            const isActive = p.status === 'I gang';

            return (
              <div key={p.id} className="flex border-b border-slate-50 hover:bg-slate-50">
                <div className="w-48 shrink-0 px-4 py-2.5 border-r border-slate-100">
                  <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-400">
                    {formatDate(p.start_date)} – {formatDate(p.end_date)}
                  </div>
                </div>
                <div className="flex-1 relative py-2.5">
                  <div
                    className={`h-5 rounded ${barColor} ${isPast && !isActive ? 'opacity-40' : 'opacity-80'} flex items-center justify-center px-1.5`}
                    style={{ marginLeft: `${left}%`, width: `${width}%` }}
                    title={`${p.name}: ${formatDate(p.start_date)} – ${formatDate(p.end_date)}`}
                  >
                    {width > 12 && (
                      <span className="text-[10px] font-medium text-white truncate">{p.status}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}