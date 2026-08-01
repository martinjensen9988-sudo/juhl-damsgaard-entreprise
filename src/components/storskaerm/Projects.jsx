import React from 'react';

const statusColor = {
  'I gang': 'bg-blue-500',
  'Planlægning': 'bg-amber-400',
  'Afsluttet': 'bg-emerald-500',
  'På hold': 'bg-slate-500',
};

const statusBadge = {
  'I gang': 'bg-blue-500',
  'Planlægning': 'bg-amber-400',
  'Afsluttet': 'bg-emerald-500',
  'På hold': 'bg-slate-500',
};

function calcProgress(p) {
  if (!p.start_date || !p.end_date) return null;
  const s = new Date(p.start_date).getTime();
  const e = new Date(p.end_date).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return null;
  const now = Date.now();
  return Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
}

export default function Projects({ projects }) {
  const active = projects
    .filter((p) => p.status === 'I gang' || p.status === 'Planlægning')
    .slice(0, 8);

  if (active.length === 0) return <p className="text-sm text-slate-500">Ingen aktive projekter</p>;

  return (
    <div className="space-y-3.5">
      {active.map((p) => {
        const prog = calcProgress(p);
        return (
          <div key={p.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-slate-200 truncate">{p.name}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full text-slate-950 font-medium ${statusBadge[p.status] || 'bg-slate-600'} flex-shrink-0 ml-2`}>
                {p.status}
              </span>
            </div>
            {p.customer_name && <div className="text-xs text-slate-500 mb-1.5 truncate">{p.customer_name}</div>}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${statusColor[p.status] || 'bg-slate-600'} transition-all duration-500`} style={{ width: `${prog ?? 0}%` }} />
            </div>
            {prog !== null && <div className="text-xs text-slate-500 mt-1 tabular-nums">{prog}% gennemført</div>}
          </div>
        );
      })}
    </div>
  );
}