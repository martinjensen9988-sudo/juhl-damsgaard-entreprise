import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { CloudRain, Sun, Cloud, CloudSnow, Zap, RefreshCw, HardHat, MapPin, AlertTriangle } from 'lucide-react';

const WEATHER_ICON = { Klar: Sun, Skyet: Cloud, Regn: CloudRain, Sne: CloudSnow, Torden: Zap };
const WEATHER_COLOR = { Klar: 'bg-amber-100 text-amber-600', Skyet: 'bg-slate-100 text-slate-500', Regn: 'bg-blue-100 text-blue-600', Sne: 'bg-cyan-100 text-cyan-600', Torden: 'bg-purple-100 text-purple-600' };

function parseForecast(text) {
  // Expect lines like "Mandag: Regn, 12°C" or JSON-ish. Try JSON first.
  try {
    const obj = JSON.parse(text);
    if (Array.isArray(obj)) return obj;
  } catch {}
  const days = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^(.+?):\s*(.+?),\s*(-?\d+)\s*°?C/i);
    if (m) days.push({ day: m[1].trim(), condition: m[2].trim(), temp: Number(m[3]) });
  }
  return days;
}

const condKey = (c) => {
  const s = (c || '').toLowerCase();
  if (s.includes('regn') || s.includes('byger')) return 'Regn';
  if (s.includes('sne')) return 'Sne';
  if (s.includes('torden')) return 'Torden';
  if (s.includes('skyet') || s.includes('overskyet')) return 'Skyet';
  return 'Klar';
};

export default function VejrPlanlaegning() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [forecasts, setForecasts] = useState({});
  const [fetching, setFetching] = useState(null);

  useEffect(() => {
    (async () => {
      try { setProjects(await base44.entities.Project.filter({ status: 'I gang' }, '-created_date', 100)); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const fetchWeather = async (project) => {
    setFetching(project.id);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Du er en dansk vejrstation. Giv en kort 5-døgns vejrudsigter for følgende byggeplads. Formatér svaret som EN linje pr. dag i dette præcise format:\nDag: Vejrtilstand, X°C\nBrug vejrtilstande fra denne liste: Klar, Skyet, Regn, Sne, Torden.\nDage: Mandag, Tirsdag, Onsdag, Torsdag, Fredag, Lørdag, Søndag (brug de næste 5 dage fra i dag).\nByggeplads: ${project.address || project.name}`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
      });
      const days = parseForecast(typeof res === 'string' ? res : res.response || '');
      setForecasts((f) => ({ ...f, [project.id]: days }));
    } catch (e) {
      setForecasts((f) => ({ ...f, [project.id]: [] }));
    } finally {
      setFetching(null);
    }
  };

  const fetchAll = async () => {
    for (const p of projects) { await fetchWeather(p); }
  };

  const filtered = filterProject === 'all' ? projects : projects.filter((p) => p.id === filterProject);

  const rainAlerts = filtered.filter((p) => (forecasts[p.id] || []).some((d) => condKey(d.condition) === 'Regn'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><CloudRain className="w-7 h-7 text-amber-500" /> Vejr- & Planlægningsdashboard</h1>
          <p className="text-slate-500 mt-1">Vejrudsigter for igangværende projekter — omplacér udendørs opgaver ved varslet regn</p>
        </div>
        <Button onClick={fetchAll} disabled={fetching} variant="outline" className="bg-white"><RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} /> Opdater vejr</Button>
      </div>

      {rainAlerts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-blue-900">Regnvarsler — overvej at flytte udendørs opgaver indendørs:</div>
            <div className="text-blue-700 mt-1">{rainAlerts.map((p) => p.name).join(', ')}</div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="sm:w-72 bg-white"><span className="flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5 text-slate-400" /> {filterProject === 'all' ? 'Alle projekter' : projects.find((p) => p.id === filterProject)?.name}</span></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle projekter</SelectItem>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Ingen igangværende projekter</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const fc = forecasts[p.id];
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2"><HardHat className="w-4 h-4 text-amber-500" /> {p.name}</div>
                    {p.address && <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {p.address}</div>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => fetchWeather(p)} disabled={fetching === p.id}>
                    <RefreshCw className={`w-3.5 h-3.5 ${fetching === p.id ? 'animate-spin' : ''}`} /> Vejr
                  </Button>
                </div>
                <div className="mt-4">
                  {!fc ? (
                    <div className="text-sm text-slate-400 text-center py-6">Tryk "Vejr" for at hente udsigt</div>
                  ) : fc.length === 0 ? (
                    <div className="text-sm text-red-500 text-center py-6">Kunne ikke hente vejrudsigt</div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {fc.map((d, i) => {
                        const key = condKey(d.condition);
                        const Icon = WEATHER_ICON[key] || Cloud;
                        return (
                          <div key={i} className="text-center">
                            <div className="text-xs text-slate-500 font-medium">{d.day?.slice(0, 3) || ''}</div>
                            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mt-1 ${WEATHER_COLOR[key]}`}><Icon className="w-5 h-5" /></div>
                            <div className="text-xs font-semibold text-slate-900 mt-1">{d.temp ?? '—'}°</div>
                            <div className="text-[10px] text-slate-400">{key}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}