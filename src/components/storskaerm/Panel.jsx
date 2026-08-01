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
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl flex flex-col min-h-0 h-full ${className}`}>
      <div className="flex items-center gap-3 px-8 py-6 border-b border-slate-800 flex-shrink-0">
        {Icon && <Icon className={`w-7 h-7 ${accentColors[accent] || accentColors.amber}`} />}
        <h2 className="text-2xl font-semibold text-slate-200 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 min-h-0">{children}</div>
    </div>
  );
}