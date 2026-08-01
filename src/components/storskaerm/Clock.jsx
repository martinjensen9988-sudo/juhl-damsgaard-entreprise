import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  const weekday = now.toLocaleDateString('da-DK', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex items-center justify-between px-10 py-7 bg-slate-950 border-b border-slate-800 flex-shrink-0">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
          <Building2 className="w-8 h-8 text-slate-950" />
        </div>
        <div>
          <div className="text-3xl font-bold text-white tracking-tight leading-none">Juhl & Damsgaard</div>
          <div className="text-xl text-slate-500 mt-1.5">Operations Center</div>
        </div>
      </div>

      <div className="text-7xl font-bold text-white tracking-tight tabular-nums leading-none">
        {time}
      </div>

      <div className="text-right">
        <div className="text-2xl font-medium text-slate-200 capitalize">{weekday}</div>
        <div className="text-xl text-slate-500">{dateStr}</div>
        <div className="flex items-center gap-2 justify-end mt-1.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-lg text-slate-500 tracking-wide">LIVE</span>
        </div>
      </div>
    </div>
  );
}