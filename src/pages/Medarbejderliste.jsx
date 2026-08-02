import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDKK } from '@/lib/format';
import { Search, Users, Mail, Phone, Briefcase, ChevronDown, ChevronRight } from 'lucide-react';

const tradeLabels = {
  Gravemaskinefører: 'Gravemaskinefører',
  Anlægsgartner: 'Anlægsgartner',
  Kloakmester: 'Kloakmester',
  Betonarbejder: 'Betonarbejder',
  Lastbilchauffør: 'Lastbilchauffør',
  Håndværker: 'Håndværker',
  Lærling: 'Lærling',
  Andet: 'Andet',
};

const statusColor = {
  Aktiv: 'bg-emerald-100 text-emerald-700',
  Orlov: 'bg-amber-100 text-amber-700',
  Inaktiv: 'bg-slate-100 text-slate-600',
};

export default function Medarbejderliste() {
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [emp, asg] = await Promise.all([
        base44.entities.Employee.list(),
        base44.entities.Assignment.list().catch(() => []),
      ]);
      setEmployees(emp || []);
      setAssignments(asg || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => employees.filter((e) => {
    const ms = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase());
    const mt = tradeFilter === 'all' || e.trade === tradeFilter;
    return ms && mt;
  }), [employees, search, tradeFilter]);

  const projectsFor = (name) => {
    const asg = assignments.filter((a) => a.employee_name === name);
    // de-dup by project_name
    const seen = new Set();
    const unique = [];
    asg.forEach((a) => {
      const key = a.project_name || a.project_id;
      if (key && !seen.has(key)) { seen.add(key); unique.push(a); }
    });
    return unique;
  };

  const toggle = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Medarbejderliste</h1>
          <p className="text-slate-500 mt-0.5">Kontaktoplysninger, stilling og tilknyttede projekter</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Søg navn eller email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tradeFilter} onValueChange={setTradeFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle stillinger</SelectItem>
            {Object.keys(tradeLabels).map((t) => <SelectItem key={t} value={t}>{tradeLabels[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Indlæser...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen medarbejdere fundet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const projects = projectsFor(e.name);
            const isOpen = expanded[e.id];
            return (
              <div key={e.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button onClick={() => toggle(e.id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 flex-shrink-0">
                      {e.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{e.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Briefcase className="w-3 h-3" /> {e.trade || '—'}
                        <span className={`px-1.5 py-0.5 rounded-full ${statusColor[e.status] || 'bg-slate-100 text-slate-500'}`}>{e.status || 'Aktiv'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="hidden sm:inline">{projects.length} projekt{projects.length !== 1 ? 'er' : ''}</span>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Kontaktoplysninger</h4>
                      <div className="space-y-1.5 text-sm">
                        {e.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> {e.email}</div>}
                        {e.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {e.phone}</div>}
                        {e.hourly_rate > 0 && <div className="flex items-center gap-2 text-slate-600"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {formatDKK(e.hourly_rate)}/time</div>}
                        {e.notes && <div className="text-slate-500 text-xs pt-1">{e.notes}</div>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Tilknyttede projekter ({projects.length})</h4>
                      {projects.length === 0 ? (
                        <p className="text-sm text-slate-400">Ingen aktive tildelinger.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {projects.map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-2.5 py-1.5">
                              <span className="truncate text-slate-700">{p.project_name || 'Uden navn'}</span>
                              {p.date && <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{p.date}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}