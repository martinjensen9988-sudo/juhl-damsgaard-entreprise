import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const TYPES = ['Færdigmelding', 'AR-bevis', 'Sikkerhedsinspektion', 'Selvangivelse', 'Varmeinstallation', 'Andet'];
const STATUSES = ['Ikke startet', 'I gang', 'Godkendt', 'Afvigelse'];
const STATUS_COLORS = {
  'Ikke startet': 'bg-slate-100 text-slate-600',
  'I gang': 'bg-blue-100 text-blue-700',
  Godkendt: 'bg-green-100 text-green-700',
  Afvigelse: 'bg-red-100 text-red-700',
};

export default function KvalitetsstyringOversigt() {
  const [checks, setChecks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, p] = await Promise.all([
          base44.entities.QualityCheck.list('-check_date', 500),
          base44.entities.Project.list('-created_date', 500),
        ]);
        setChecks(c);
        setProjects(p);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => {
    const c = { 'Ikke startet': 0, 'I gang': 0, Godkendt: 0, Afvigelse: 0 };
    checks.forEach((q) => { c[q.status] = (c[q.status] || 0) + 1; });
    return c;
  }, [checks]);

  const filtered = checks.filter((q) => {
    const ms = `${q.title} ${q.project_name || ''} ${q.checked_by || ''}`.toLowerCase().includes(search.toLowerCase());
    const mStat = statusFilter === 'all' || q.status === statusFilter;
    const mType = typeFilter === 'all' || q.type === typeFilter;
    const mProj = projectFilter === 'all' || q.project_id === projectFilter;
    return ms && mStat && mType && mProj;
  });

  const itemsProgress = (q) => {
    if (!q.items || q.items.length === 0) return 0;
    return Math.round((q.items.filter((i) => i.checked).length / q.items.length) * 100);
  };

  const cards = [
    { label: 'I alt', value: checks.length, icon: ShieldCheck, color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Ikke startet', value: counts['Ikke startet'], icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'I gang', value: counts['I gang'], icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Godkendt', value: counts.Godkendt, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Afvigelse', value: counts.Afvigelse, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kvalitetsstyring — oversigt</h1>
        <p className="text-slate-500 text-sm mt-1">Alle igangværende og afsluttede kvalitetskontroller på tværs af projekter.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border p-5">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input placeholder="Søg…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statusser</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle typer</SelectItem>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger><SelectValue placeholder="Projekt" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle projekter</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Kontrol</th>
                <th className="px-4 py-3 font-medium">Projekt</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Fremskridt</th>
                <th className="px-4 py-3 font-medium">Tjekket af</th>
                <th className="px-4 py-3 font-medium">Dato</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Indlæser…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Ingen kvalitetskontroller fundet</td></tr>
              ) : filtered.map((q) => {
                const rate = itemsProgress(q);
                return (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{q.title}</td>
                    <td className="px-4 py-3 text-slate-600">{q.project_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{q.type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status] || 'bg-slate-100'}`}>{q.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{q.checked_by || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{q.check_date || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}