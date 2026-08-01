import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Users, Loader2, Briefcase, Clock, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/format';

export default function Ressourceallokering() {
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [e, a, p, t] = await Promise.all([
          base44.entities.Employee.list(),
          base44.entities.Assignment.list(),
          base44.entities.Project.list(),
          base44.entities.TimeEntry.list(),
        ]);
        setEmployees(e.filter((emp) => emp.status === 'Aktiv'));
        setAssignments(a);
        setProjects(p);
        setTimeEntries(t);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const today = new Date();
  const weekFromNow = new Date(today); weekFromNow.setDate(weekFromNow.getDate() + 7);

  const isUpcoming = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= today && d <= weekFromNow;
  };

  const loadData = (emp) => {
    const empAssignments = assignments.filter((a) => a.employee_name === emp.name && isUpcoming(a.date));
    const empTime = timeEntries.filter((t) => t.employee_name === emp.name);
    const weekHours = empTime
      .filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);
        const diff = (d - today) / (1000 * 60 * 60 * 24);
        return diff >= -7 && diff <= 7;
      })
      .reduce((s, t) => s + (t.hours || 0), 0);
    const projIds = [...new Set(empAssignments.map((a) => a.project_id))];
    const projNames = empAssignments.map((a) => a.project_name).filter(Boolean);
    return {
      assignments: empAssignments,
      assignmentCount: empAssignments.length,
      projectNames: projNames,
      weekHours,
      utilization: Math.min(100, Math.round((weekHours / 40) * 100)),
    };
  };

  const all = employees.map((emp) => ({ emp, ...loadData(emp) }));
  const sorted = [...all].sort((a, b) => b.utilization - a.utilization);

  const barColor = (util) => {
    if (util > 100) return 'bg-red-500';
    if (util > 80) return 'bg-amber-500';
    if (util > 40) return 'bg-emerald-500';
    return 'bg-slate-300';
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  const overloaded = sorted.filter((s) => s.utilization > 100).length;
  const totalHours = sorted.reduce((s, x) => s + x.weekHours, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-6 h-6 text-amber-500" /> Ressourceallokering</h1>
        <p className="text-sm text-slate-500 mt-1">Visuel oversigt over medarbejdernes belastning (næste 7 dage)</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Aktive medarbejdere</div><div className="text-2xl font-bold text-slate-900">{employees.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Timer (seneste uge)</div><div className="text-2xl font-bold text-slate-900">{Math.round(totalHours)}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Overbelastede</div><div className="text-2xl font-bold text-red-600">{overloaded}</div></Card>
      </div>

      <div className="space-y-3">
        {sorted.map(({ emp, assignmentCount, projectNames, weekHours, utilization }) => (
          <Card key={emp.id} className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-3 lg:w-64 shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${utilization > 100 ? 'bg-red-500' : utilization > 80 ? 'bg-amber-500' : 'bg-slate-700'}`}>
                  {emp.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{emp.name}</div>
                  <div className="text-xs text-slate-500">{emp.trade}</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{Math.round(weekHours)} timer / 40 timer</span>
                  <span className={`text-xs font-medium ${utilization > 100 ? 'text-red-600' : 'text-slate-600'}`}>{utilization}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor(utilization)} rounded-full transition-all`} style={{ width: `${Math.min(100, utilization)}%` }} />
                </div>
              </div>
              <div className="lg:w-64 shrink-0">
                {projectNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {projectNames.slice(0, 3).map((p, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1"><Briefcase className="w-3 h-3" />{p}</span>
                    ))}
                    {projectNames.length > 3 && <span className="text-xs text-slate-400">+{projectNames.length - 3}</span>}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Ingen opgaver</span>
                )}
              </div>
            </div>
          </Card>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-slate-400"><Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />Ingen aktive medarbejdere</div>
        )}
      </div>
    </div>
  );
}