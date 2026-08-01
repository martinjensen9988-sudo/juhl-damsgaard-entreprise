import React from 'react';
import { ShieldAlert, CalendarClock } from 'lucide-react';

const actionLabels = {
  Oprettet: 'Oprettet',
  Opdateret: 'Opdateret',
  Slettet: 'Slettet',
  Accepteret: 'Accepteret',
  Afvist: 'Afvist',
  Godkendt: 'Godkendt',
  Sendt: 'Sendt',
  Betalt: 'Betalt',
  'Statusændring': 'Status',
  Andet: 'Aktivitet',
};

export default function Feeds({ activity, safety, deadlines }) {
  return (
    <>
      <div className="mb-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Seneste aktivitet</div>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500">Ingen aktivitet</p>
        ) : (
          <div className="space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-slate-200">{actionLabels[a.action] || a.action}</span>{' '}
                  <span className="text-slate-400 truncate">{a.entity_name || a.entity_type}</span>
                  {a.user_name && <div className="text-xs text-slate-600">{a.user_name}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Sikkerhed & afvigelser
        </div>
        {safety.length === 0 ? (
          <p className="text-sm text-emerald-400/70">✓ Alt roligt</p>
        ) : (
          <div className="space-y-2">
            {safety.map((s) => (
              <div key={s.id} className="flex items-start gap-2 text-sm bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${s.severity === 'Kritisk' || s.severity === 'Høj' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 truncate">{s.title}</div>
                  <div className="text-xs text-slate-500 truncate">{s.project_name || s.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 text-cyan-400" /> Kommende deadlines
        </div>
        {deadlines.length === 0 ? (
          <p className="text-sm text-slate-500">Ingen kommende deadlines</p>
        ) : (
          <div className="space-y-2">
            {deadlines.map((d, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${d.tagBg} ${d.tagText} flex-shrink-0`}>{d.type}</span>
                <div className="flex-1 min-w-0 truncate text-slate-300">{d.label}</div>
                <div className="text-xs text-slate-500 flex-shrink-0 tabular-nums">{d.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}