import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK, formatDate } from '@/lib/format';
import { Eye, Calendar, MapPin, HardHat } from 'lucide-react';

const STATUS_STYLE = {
  'Planlægning': 'bg-amber-50 border-amber-200 text-amber-700',
  'I gang': 'bg-blue-50 border-blue-200 text-blue-700',
  'Afsluttet': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  'På hold': 'bg-slate-100 border-slate-200 text-slate-600',
};

export default function ProjektOverblik() {
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, m, t, i] = await Promise.all([
          base44.entities.Project.list('-created_date', 200),
          base44.entities.Milestone.list('-due_date', 200),
          base44.entities.TimeEntry.list('-created_date', 500),
          base44.entities.Invoice.list('-created_date', 200),
        ]);
        setProjects(p); setMilestones(m); setTimeEntries(t); setInvoices(i);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const activeProjects = projects.filter((p) => p.status === 'I gang' || p.status === 'Planlægning');

  const getProjectData = (project) => {
    const projMilestones = milestones.filter((m) => m.project_id === project.id);
    const completedMilestones = projMilestones.filter((m) => m.status === 'Gennemført').length;
    const totalMilestones = projMilestones.length;
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    const projTime = timeEntries.filter((t) => t.project_id === project.id);
    const totalHours = projTime.reduce((s, t) => s + (t.hours || 0), 0);
    const projInvoices = invoices.filter((i) => i.project_id === project.id);
    const invoicedAmount = projInvoices.reduce((s, i) => s + calcTotal(i.line_items), 0);
    const nextMilestone = projMilestones
      .filter((m) => m.status !== 'Gennemført')
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))[0];
    const overdueMilestones = projMilestones.filter((m) => m.status === 'Forsinket').length;
    return { progress, totalMilestones, completedMilestones, totalHours, invoicedAmount, nextMilestone, overdueMilestones };
  };

  function calcTotal(items) { return ((items || []).reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0)) * 1.25; }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projektoverblik</h1>
        <p className="text-slate-500 mt-1">Visuel status og fremdrift for aktive projekter</p>
      </div>

      {activeProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen aktive projekter.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProjects.map((p) => {
            const data = getProjectData(p);
            const isOverdue = data.overdueMilestones > 0;
            return (
              <div key={p.id} className={`bg-white rounded-xl border-2 p-5 ${isOverdue ? 'border-red-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.customer_name || '—'}</div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[p.status] || STATUS_STYLE['Planlægning']}`}>{p.status}</span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Fremdrift</span>
                    <span className="font-semibold text-slate-700">{data.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${data.progress >= 100 ? 'bg-emerald-500' : data.progress >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`} style={{ width: `${data.progress}%` }}></div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{data.completedMilestones}/{data.totalMilestones} milepæle gennemført</div>
                </div>

                {/* Next milestone */}
                {data.nextMilestone && (
                  <div className={`rounded-lg p-2.5 mb-3 ${data.overdueMilestones > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <div className="text-xs text-slate-500 mb-0.5">Næste milepæl</div>
                    <div className="text-sm font-medium text-slate-900 truncate">{data.nextMilestone.title}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Calendar className="w-3 h-3" /> {data.nextMilestone.due_date ? formatDate(data.nextMilestone.due_date) : 'Ingen deadline'}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50">
                  <div>
                    <div className="text-xs text-slate-400">Timer</div>
                    <div className="text-sm font-semibold text-slate-900">{data.totalHours}t</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Faktureret</div>
                    <div className="text-sm font-semibold text-slate-900">{formatDKK(data.invoicedAmount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Budget</div>
                    <div className="text-sm font-semibold text-slate-900">{p.budget ? formatDKK(p.budget) : '—'}</div>
                  </div>
                </div>

                {p.address && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-2"><MapPin className="w-3 h-3" /> {p.address}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}