import React from 'react';
import { Truck, Wrench } from 'lucide-react';

const statusConfig = {
  'I brug': { bg: 'bg-emerald-400/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Ledig': { bg: 'bg-slate-400/10', text: 'text-slate-400', dot: 'bg-slate-500' },
  'Reparation': { bg: 'bg-amber-400/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  'Ude af drift': { bg: 'bg-red-400/10', text: 'text-red-400', dot: 'bg-red-400' },
};

export default function Vehicles({ equipment }) {
  const vehicles = equipment.filter((e) => e.category === 'Køretøj');
  const other = equipment.filter((e) => e.category !== 'Køretøj');

  if (vehicles.length === 0 && other.length === 0) {
    return <p className="text-sm text-slate-500">Intet materiel registreret</p>;
  }

  return (
    <>
      {vehicles.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-violet-400" /> Køretøjer
          </div>
          <div className="space-y-2">
            {vehicles.map((v) => {
              const s = statusConfig[v.status] || statusConfig['Ledig'];
              const location = v.assigned_project_name || v.location;
              return (
                <div key={v.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2.5">
                  <Truck className={`w-5 h-5 ${s.text} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{v.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {location ? `📍 ${location}` : 'Ikke tildelt'}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.bg} ${s.text} flex-shrink-0`}>{v.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-400" /> Andet materiel
          </div>
          <div className="grid grid-cols-2 gap-2">
            {other.slice(0, 10).map((e) => {
              const s = statusConfig[e.status] || statusConfig['Ledig'];
              return (
                <div key={e.id} className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-2.5 py-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot} flex-shrink-0`} />
                  <div className="text-xs text-slate-300 truncate flex-1">{e.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}