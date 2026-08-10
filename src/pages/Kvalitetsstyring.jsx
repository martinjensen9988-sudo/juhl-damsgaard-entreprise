import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, Loader2, Check, FileText, Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/format';

const TYPES = ['Færdigmelding', 'AR-bevis', 'Sikkerhedsinspektion', 'Selvangivelse', 'Varmeinstallation', 'Andet'];
const STATUSES = ['Ikke startet', 'I gang', 'Godkendt', 'Afvigelse'];

const STATUS_BADGE = {
  'Ikke startet': 'bg-slate-100 text-slate-500',
  'I gang': 'bg-blue-100 text-blue-700',
  'Godkendt': 'bg-emerald-100 text-emerald-700',
  'Afvigelse': 'bg-red-100 text-red-700',
};
const STATUS_ICON = {
  'Ikke startet': Clock,
  'I gang': Clock,
  'Godkendt': CheckCircle2,
  'Afvigelse': AlertCircle,
};

export default function Kvalitetsstyring() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    try {
      setChecks(await base44.entities.QualityCheck.list('-created_date', 500));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const projects = [...new Set(checks.map((c) => c.project_name).filter(Boolean))].sort();

  const filtered = checks
    .filter((c) => filterProject === 'all' || c.project_name === filterProject)
    .filter((c) => filterType === 'all' || c.type === filterType)
    .filter((c) => filterStatus === 'all' || c.status === filterStatus)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.title || '').toLowerCase().includes(q) || (c.project_name || '').toLowerCase().includes(q) || (c.checked_by || '').toLowerCase().includes(q);
    });

  const approved = checks.filter((c) => c.status === 'Godkendt');
  const deviations = checks.filter((c) => c.status === 'Afvigelse');
  const inProgress = checks.filter((c) => c.status === 'I gang');

  const grouped = projects
    .filter((p) => filterProject === 'all' || p === filterProject)
    .map((proj) => ({
      name: proj,
      items: filtered.filter((c) => c.project_name === proj),
    }))
    .filter((g) => g.items.length > 0);
  const unassigned = filtered.filter((c) => !c.project_name);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-amber-500" /> Kvalitetsstyring</h1>
        <p className="text-sm text-slate-500 mt-1">Samlet dokumentation af udfyldte tjeklister til bygherre</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Samlede tjek</div><div className="text-2xl font-bold text-slate-900">{checks.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Godkendte</div><div className="text-2xl font-bold text-emerald-600">{approved.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> I gang</div><div className="text-2xl font-bold text-blue-600">{inProgress.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Afvigelser</div><div className="text-2xl font-bold text-red-600">{deviations.length}</div></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative sm:max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Søg tjeklister..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-transparent text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Alle projekter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle projekter</SelectItem>
            {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statusser</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grouped by project */}
      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.name}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">{group.name}</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{group.items.length} tjek</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map((c) => {
                const SIcon = STATUS_ICON[c.status] || Clock;
                const checkedCount = (c.items || []).filter((i) => i.checked).length;
                const total = (c.items || []).length;
                const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
                return (
                  <Card key={c.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewing(c)}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] || ''}`}>
                        <SIcon className="w-3 h-3" />{c.status}
                      </span>
                      <span className="text-xs text-slate-400">{c.type}</span>
                    </div>
                    <div className="font-medium text-slate-900 text-sm mb-1 truncate">{c.title}</div>
                    <div className="text-xs text-slate-400 mb-2">
                      {c.check_date && formatDate(c.check_date)}
                      {c.checked_by && ` • ${c.checked_by}`}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{checkedCount}/{total} punkter</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
        {unassigned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Uden projekt</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{unassigned.length}</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {unassigned.map((c) => {
                const checkedCount = (c.items || []).filter((i) => i.checked).length;
                const total = (c.items || []).length;
                const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
                const SIcon = STATUS_ICON[c.status] || Clock;
                return (
                  <Card key={c.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewing(c)}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] || ''}`}><SIcon className="w-3 h-3" />{c.status}</span>
                      <span className="text-xs text-slate-400">{c.type}</span>
                    </div>
                    <div className="font-medium text-slate-900 text-sm mb-1 truncate">{c.title}</div>
                    <div className="text-xs text-slate-400 mb-2">{c.check_date && formatDate(c.check_date)}{c.checked_by && ` • ${c.checked_by}`}</div>
                    <div className="flex items-center justify-between text-xs text-slate-500"><span>{checkedCount}/{total} punkter</span><span className="font-medium">{pct}%</span></div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400"><ShieldCheck className="w-12 h-12 mx-auto mb-2 text-slate-300" />Ingen tjeklister matcher filtrene</div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-slate-500" /> {viewing.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[viewing.status] || ''}`}>{viewing.status}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{viewing.type}</span>
                  {viewing.project_name && <span className="text-xs text-slate-500">{viewing.project_name}</span>}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  {viewing.check_date && <span>Dato: {formatDate(viewing.check_date)}</span>}
                  {viewing.checked_by && <span>Tjekket af: {viewing.checked_by}</span>}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Tjekpunkter</h3>
                  {(!viewing.items || viewing.items.length === 0) ? (
                    <p className="text-sm text-slate-400">Ingen tjekpunkter registreret.</p>
                  ) : (
                    <div className="space-y-2">
                      {viewing.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3">
                          <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                            {item.checked && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-slate-900">{item.description || '(ingen beskrivelse)'}</div>
                            {item.notes && <div className="text-xs text-slate-500 mt-1">{item.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {viewing.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Supplerende noter</h3>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{viewing.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}