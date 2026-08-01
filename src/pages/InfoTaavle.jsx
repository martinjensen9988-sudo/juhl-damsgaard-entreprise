import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import Clock from '@/components/storskaerm/Clock';
import Panel from '@/components/storskaerm/Panel';
import { Target, ListChecks, MapPin, Truck, HardHat, FileText, Receipt, CheckCircle2, Circle } from 'lucide-react';

const statusColor = {
  'I brug': 'text-emerald-400 bg-emerald-400/10',
  'Ledig': 'text-slate-400 bg-slate-400/10',
  'Reparation': 'text-amber-400 bg-amber-400/10',
  'Ude af drift': 'text-red-400 bg-red-400/10',
};

export default function InfoTaavle() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  const calcZoom = useCallback(() => {
    setZoom(Math.max(1, window.innerWidth / 1600));
  }, []);

  useEffect(() => {
    calcZoom();
    window.addEventListener('resize', calcZoom);
    return () => window.removeEventListener('resize', calcZoom);
  }, [calcZoom]);

  const loadData = useCallback(async () => {
    try {
      const [projects, quotes, invoices, vehicles, tasks, assignments] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Quote.list(),
        base44.entities.Invoice.list(),
        base44.entities.Vehicle.list(),
        base44.entities.Task.list(),
        base44.entities.Assignment.list(),
      ]);
      setData({ projects, quotes, invoices, vehicles, tasks, assignments });
    } catch (e) {
      console.error('InfoTaavle load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 60000);
    return () => clearInterval(t);
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const lineTotal = (items = []) => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  const activeProjects = data.projects.filter((p) => p.status === 'I gang').length;
  const openQuotes = data.quotes.filter((q) => q.status === 'Sendt' || q.status === 'Kladde');
  const quoteValue = openQuotes.reduce((s, q) => s + lineTotal(q.line_items), 0);
  const outstanding = data.invoices.filter((i) => i.status === 'Sendt' || i.status === 'Forfalden');
  const invoiceAmount = outstanding.reduce((s, i) => s + lineTotal(i.line_items), 0);
  const vehiclesInUse = data.vehicles.filter((v) => v.status === 'I brug').length;
  const todaysAssignments = data.assignments.filter((a) => a.date === todayStr);
  const todaysTasks = data.tasks.filter((t) => t.due_date === todayStr);

  const kpis = [
    { label: 'Aktive projekter', value: activeProjects, icon: HardHat, color: 'text-amber-400' },
    { label: 'Tilbud igang', value: openQuotes.length, sub: formatDKK(quoteValue), icon: FileText, color: 'text-blue-400' },
    { label: 'Udestående fakt.', value: outstanding.length, sub: formatDKK(invoiceAmount), icon: Receipt, color: 'text-emerald-400' },
    { label: 'Biler i brug', value: `${vehiclesInUse}/${data.vehicles.length}`, icon: Truck, color: 'text-violet-400' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden" style={{ zoom }}>
      <Clock />
      <div className="flex-1 p-8 grid grid-cols-12 gap-8 min-h-0">
        <Panel title="Dagens nøgletal" icon={Target} accent="amber" className="col-span-4">
          <div className="space-y-6">
            {kpis.map((k) => (
              <div key={k.label} className="bg-slate-800/50 rounded-3xl p-8 flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <k.icon className={`w-10 h-10 ${k.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-6xl font-bold text-white tabular-nums leading-none">{k.value}</div>
                  <div className="text-2xl text-slate-400 mt-3">{k.label}</div>
                  {k.sub && <div className="text-lg text-slate-500 mt-1.5 tabular-nums">{k.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Opgaveoversigt" icon={ListChecks} accent="blue" className="col-span-4">
          <div className="mb-8">
            <div className="text-lg text-slate-500 uppercase tracking-wide mb-3">Dagens tildelinger ({todaysAssignments.length})</div>
            {todaysAssignments.length === 0 ? (
              <p className="text-xl text-slate-500">Ingen tildelinger i dag</p>
            ) : (
              <div className="space-y-3">
                {todaysAssignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 bg-slate-800/50 rounded-xl px-5 py-4">
                    <div className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xl font-medium text-slate-200 truncate">{a.employee_name}</div>
                      <div className="text-lg text-slate-500 truncate">→ {a.project_name || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-lg text-slate-500 uppercase tracking-wide mb-3">Deadline i dag ({todaysTasks.length})</div>
            {todaysTasks.length === 0 ? (
              <p className="text-xl text-slate-500">Ingen opgaver med deadline i dag</p>
            ) : (
              <div className="space-y-3">
                {todaysTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 bg-slate-800/50 rounded-xl px-5 py-4">
                    {t.status === 'Gennemført' ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className={`w-7 h-7 flex-shrink-0 ${t.priority === 'Høj' ? 'text-red-400' : 'text-slate-400'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`text-xl truncate ${t.status === 'Gennemført' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{t.title}</div>
                      {t.assigned_to && <div className="text-lg text-slate-500 truncate">{t.assigned_to}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Live lokation — biler" icon={MapPin} accent="violet" className="col-span-4">
          {data.vehicles.length === 0 ? (
            <p className="text-xl text-slate-500">Ingen køretøjer registreret</p>
          ) : (
            <div className="space-y-4">
              {data.vehicles.map((v) => (
                <div key={v.id} className="bg-slate-800/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Truck className="w-7 h-7 text-violet-400" />
                      <div className="text-2xl font-medium text-slate-100">{v.name}</div>
                    </div>
                    <span className={`text-base font-medium px-3 py-1.5 rounded-full ${statusColor[v.status] || statusColor['Ledig']}`}>{v.status}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xl">
                    <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-300 truncate">
                      {v.assigned_project_name || v.location || 'Ikke tildelt'}
                    </span>
                  </div>
                  {v.plate_number && <div className="text-lg text-slate-500 mt-2">Reg: {v.plate_number}</div>}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}