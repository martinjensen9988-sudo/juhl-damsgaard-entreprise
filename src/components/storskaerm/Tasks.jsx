import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const priorityColor = { Høj: 'text-red-400', Normal: 'text-slate-400', Lav: 'text-slate-500' };

export default function Tasks({ assignments, tasks }) {
  return (
    <>
      <div className="mb-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Dagens tildelinger</div>
        {assignments.length === 0 ? (
          <p className="text-sm text-slate-500">Ingen tildelinger i dag</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{a.employee_name}</div>
                  <div className="text-xs text-slate-500 truncate">→ {a.project_name || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Opgaver (deadline i dag)</div>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">Ingen opgaver med deadline i dag</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2.5">
                {t.status === 'Gennemført' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className={`w-5 h-5 flex-shrink-0 ${priorityColor[t.priority] || 'text-slate-400'}`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${t.status === 'Gennemført' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{t.title}</div>
                  {t.assigned_to && <div className="text-xs text-slate-500 truncate">{t.assigned_to}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}