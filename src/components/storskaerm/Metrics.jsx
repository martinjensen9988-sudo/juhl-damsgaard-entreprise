import React from 'react';
import { HardHat, FileText, Receipt, Truck } from 'lucide-react';
import { formatDKK } from '@/lib/format';

export default function Metrics({ activeProjects, openQuotes, quoteValue, outstandingInvoices, invoiceAmount, vehiclesInUse, totalVehicles }) {
  const metrics = [
    { label: 'Aktive projekter', value: activeProjects, sub: null, icon: HardHat, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Tilbud igang', value: openQuotes, sub: formatDKK(quoteValue), icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Udestående fakturaer', value: outstandingInvoices, sub: formatDKK(invoiceAmount), icon: Receipt, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Køretøjer i brug', value: `${vehiclesInUse}/${totalVehicles}`, sub: null, icon: Truck, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 flex-shrink-0">
      {metrics.map((m) => (
        <div key={m.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${m.bg}`}>
            <m.icon className={`w-7 h-7 ${m.color}`} />
          </div>
          <div className="min-w-0">
            <div className="text-3xl font-bold text-white tabular-nums leading-none truncate">{m.value}</div>
            <div className="text-sm text-slate-400 mt-1.5 truncate">{m.label}</div>
            {m.sub && <div className="text-xs text-slate-500 mt-0.5 tabular-nums truncate">{m.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}