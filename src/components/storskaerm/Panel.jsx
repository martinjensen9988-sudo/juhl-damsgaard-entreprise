import React from 'react';

const accentColors = {
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  red: 'text-red-400',
  violet: 'text-violet-400',
  cyan: 'text-cyan-400',
};

export default function Panel({ title, icon: Icon, accent = 'amber', children, className = '' }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl flex flex-col min-h-0 h-full ${className}`}>
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-800 flex-shrink-0">
        {Icon && <Icon className={`w-5 h-5 ${accentColors[accent] || accentColors.amber}`} />}
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">{children}</div>
    </div>
  );
}