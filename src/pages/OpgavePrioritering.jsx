import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListOrdered, CheckCircle2, Circle, Clock, Flame } from 'lucide-react';

const PRIORITIES = ['Høj', 'Normal', 'Lav'];
const STATUSES = ['Ikke startet', 'I gang', 'Afventer', 'Gennemført'];
const priorityWeight = { 'Høj': 3, 'Normal': 2, 'Lav': 1 };
const statusBadge = { 'Ikke startet': 'bg-slate-100 text-slate-600', 'I gang': 'bg-amber-100 text-amber-700', 'Afventer': 'bg-blue-100 text-blue-700', 'Gennemført': 'bg-emerald-100 text-emerald-700' };
const priorityColor = { 'Høj': 'text-red-500', 'Normal': 'text-amber-500', 'Lav': 'text-slate-400' };

export default function OpgavePrioritering() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => { try { setTasks(await base44.entities.Task.list()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const sorted = [...tasks].sort((a, b) => {
    const pa = priorityWeight[a.priority] || 2;
    const pb = priorityWeight[b.priority] || 2;
    if (pb !== pa) return pb - pa;
    return (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1;
  });

  const cyclePriority = async (t) => {
    const idx = PRIORITIES.indexOf(t.priority || 'Normal');
    const next = PRIORITIES[(idx + 1) % PRIORITIES.length];
    await base44.entities.Task.update(t.id, { priority: next });
    load();
  };
  const setStatus = async (t, status) => { await base44.entities.Task.update(t.id, { status }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Opgaveprioritering</h1>
      <p className="text-sm text-slate-500 mb-6">Rangordn daglige opgaver baseret på prioritet og deadline</p>

      <div className="space-y-2">
        {sorted.map((t, i) => {
          const overdue = t.due_date && t.status !== 'Gennemført' && new Date(t.due_date) < new Date();
          return (
            <div key={t.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${overdue ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
              <div className="text-slate-300 font-bold text-lg w-8 text-center">{i + 1}</div>
              <button onClick={() => setStatus(t, t.status === 'Gennemført' ? 'Ikke startet' : 'Gennemført')} className="flex-shrink-0">
                {t.status === 'Gennemført' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className={`w-6 h-6 ${priorityColor[t.priority] || priorityColor['Normal']}`} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${t.status === 'Gennemført' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  {t.due_date && <span className={`flex items-center gap-1 ${overdue ? 'text-red-600' : ''}`}><Clock className="w-3.5 h-3.5" /> {formatDate(t.due_date)}</span>}
                  {t.assigned_to && <span>{t.assigned_to}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {t.priority === 'Høj' && <Flame className="w-4 h-4 text-red-500" />}
                <button onClick={() => cyclePriority(t)} className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${t.priority === 'Høj' ? 'border-red-200 bg-red-50 text-red-700' : t.priority === 'Lav' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{t.priority || 'Normal'}</button>
                <Select value={t.status || 'Ikke startet'} onValueChange={(v) => setStatus(t, v)}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
      {tasks.length === 0 && <div className="text-center py-16 text-slate-400"><ListOrdered className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Ingen opgaver</p></div>}
    </div>
  );
}