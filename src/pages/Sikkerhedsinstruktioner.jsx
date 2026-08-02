import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShieldCheck, AlertTriangle, FileText, Download, ChevronDown, ChevronUp, HardHat } from 'lucide-react';
import { formatDate } from '@/lib/format';

const categoryColors = {
  Arbejdsmiljø: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Sikkerhedsprotokol: 'bg-red-100 text-red-700 border-red-200',
  Vejledning: 'bg-blue-100 text-blue-700 border-blue-200',
  Risikoavurdering: 'bg-amber-100 text-amber-700 border-amber-200',
  Værneudstyr: 'bg-purple-100 text-purple-700 border-purple-200',
  Andet: 'bg-slate-100 text-slate-600 border-slate-200',
};

const riskColors = {
  Lav: 'bg-emerald-100 text-emerald-700',
  Mellem: 'bg-amber-100 text-amber-700',
  Høj: 'bg-orange-100 text-orange-700',
  Kritisk: 'bg-red-100 text-red-700',
};

export default function Sikkerhedsinstruktioner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [expanded, setExpanded] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SafetyProtocol.list('-updated_date');
      setItems(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => items.filter((p) => {
    const ms = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.content?.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'all' || p.category === catFilter;
    const mr = riskFilter === 'all' || p.risk_level === riskFilter;
    return ms && mc && mr;
  }), [items, search, catFilter, riskFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((p) => { (map[p.category] = map[p.category] || []).push(p); });
    return map;
  }, [filtered]);

  const toggle = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Sikkerhedsinstruktioner</h1>
          <p className="text-slate-500 mt-0.5">Læs instruks-manualer og gennemgå sikkerhedsprotokoller før arbejdet starter</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Vigtigt:</span> Gennemgå altid relevante sikkerhedsinstruktioner før du starter på byggepladsen.
          Kontakt din leder ved spørgsmål til protokoller eller værneudstyr.
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Søg i titel eller indhold..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {Object.keys(categoryColors).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Risiko" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle risici</SelectItem>
            {Object.keys(riskColors).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Indlæser...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen instruktioner fundet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, protos]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColors[cat] || categoryColors.Andet}`}>
                  {cat}
                </span>
                <span className="text-sm text-slate-400">{protos.length} {protos.length === 1 ? 'instruks' : 'instrukser'}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {protos.map((p) => {
                  const isOpen = expanded[p.id];
                  const content = p.content || '';
                  const isLong = content.length > 200;
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <button onClick={() => toggle(p.id)} className="w-full text-left p-5 hover:bg-slate-50 transition">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-start gap-2">
                            <FileText className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <h3 className="font-semibold text-slate-900">{p.title}</h3>
                          </div>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {p.risk_level && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${riskColors[p.risk_level]}`}>Risiko: {p.risk_level}</span>
                          )}
                          {p.applies_to && <span className="text-xs text-slate-500">Gælder: {p.applies_to}</span>}
                        </div>
                        {p.required_ppe && (
                          <div className="text-xs text-slate-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mt-2">
                            <span className="font-medium">Påkrævet værnemiddel: </span>{p.required_ppe}
                          </div>
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{content}</div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              {p.created_by && <span>af {p.created_by}</span>}
                              {p.last_updated && <span>Opd. {formatDate(p.last_updated)}</span>}
                            </div>
                            {p.file_url && (
                              <a href={p.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium">
                                <Download className="w-3.5 h-3.5" /> Hent fil
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}