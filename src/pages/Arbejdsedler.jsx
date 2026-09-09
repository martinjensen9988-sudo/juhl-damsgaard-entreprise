import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK, calcTotal, formatDate } from '@/lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Clock, Package, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Arbejdsedler() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [timeEntries, setTimeEntries] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [images, setImages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, e] = await Promise.all([
          base44.entities.Project.list('-created_date', 200),
          base44.entities.Employee.list('-created_date', 200),
        ]);
        setProjects(p);
        setEmployees(e);
        if (p.length > 0) setSelectedId(p[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      try {
        const [t, m, i, inv] = await Promise.all([
          base44.entities.TimeEntry.filter({ project_id: selectedId }, '-date', 200),
          base44.entities.Material.filter({ project_id: selectedId }, '-created_date', 200),
          base44.entities.ProjectImage.filter({ project_id: selectedId }, '-upload_date', 200),
          base44.entities.Invoice.filter({ project_id: selectedId }, '-created_date', 200),
        ]);
        setTimeEntries(t);
        setMaterials(m);
        setImages(i);
        setInvoices(inv);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [selectedId]);

  const project = projects.find((p) => p.id === selectedId);

  const empRate = (name) => {
    const e = employees.find((e) => e.name === name);
    return e?.hourly_rate || 0;
  };

  const totalHours = timeEntries.reduce((s, t) => s + (t.hours || 0), 0);
  const laborCost = timeEntries.reduce((s, t) => s + (t.hours || 0) * empRate(t.user_name), 0);
  const materialCost = materials.reduce((s, m) => s + (m.quantity || 0) * (m.unit_price || 0), 0);
  const totalCost = laborCost + materialCost;
  const revenue = invoices.reduce((s, i) => s + calcTotal(i.line_items), 0) || project?.budget || 0;
  const dækningsgrad = revenue > 0 ? Math.round(((revenue - totalCost) / revenue) * 100) : null;
  const profit = revenue - totalCost;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Arbejdssedler</h1>
        <p className="text-slate-500 mt-1">Samlet dokumentation pr. sag med dækningsgradsberegning</p>
      </div>

      {/* Project selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">Vælg sag:</label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="max-w-md"><SelectValue placeholder="Vælg sag" /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} – {p.customer_name || ''}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!project ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 py-16 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Vælg et projekt for at se arbejdseddel.</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><TrendingUp className="w-4 h-4" /> Omsætning</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatDKK(revenue)}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><Clock className="w-4 h-4" /> Timeløn</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatDKK(laborCost)}</div>
              <div className="text-xs text-slate-400">{totalHours} timer</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><Package className="w-4 h-4" /> Materialer</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatDKK(materialCost)}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-slate-500 text-sm mb-1">Dækningsgrad</div>
              <div className={`text-lg font-bold ${dækningsgrad === null ? 'text-slate-400' : dækningsgrad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {dækningsgrad === null ? '—' : `${dækningsgrad}%`}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-slate-500 text-sm mb-1">Resultat</div>
              <div className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatDKK(profit)}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Time entries */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Tidsregistreringer</h2>
                <span className="ml-auto text-sm text-slate-400">{totalHours} timer</span>
              </div>
              {timeEntries.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">Ingen timer registreret</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm mobile-cards">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                        <th className="px-4 py-2">Dato</th>
                        <th className="px-4 py-2">Medarbejder</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2 text-right">Timer</th>
                        <th className="px-4 py-2 text-right">Løn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {timeEntries.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-300" data-label="Dato">{formatDate(t.date)}</td>
                          <td className="px-4 py-2 text-slate-900 dark:text-slate-100 font-medium" data-label="Medarbejder">{t.user_name}</td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400" data-label="Type">{t.task_type}</td>
                          <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-200" data-label="Timer">{t.hours}</td>
                          <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-200" data-label="Løn">{formatDKK((t.hours || 0) * empRate(t.user_name))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Materials */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Materialer</h2>
                <span className="ml-auto text-sm text-slate-400">{formatDKK(materialCost)}</span>
              </div>
              {materials.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">Ingen materialer registreret</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm mobile-cards">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                        <th className="px-4 py-2">Materiale</th>
                        <th className="px-4 py-2 text-right">Antal</th>
                        <th className="px-4 py-2 text-right">Pris</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {materials.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-2 text-slate-900 dark:text-slate-100 font-medium" data-label="Materiale">{m.name}</td>
                          <td className="px-4 py-2 text-right text-slate-500 dark:text-slate-400" data-label="Antal">{m.quantity} {m.unit}</td>
                          <td className="px-4 py-2 text-right text-slate-500 dark:text-slate-400" data-label="Pris">{formatDKK(m.unit_price || 0)}</td>
                          <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-200 font-medium" data-label="Total">{formatDKK((m.quantity || 0) * (m.unit_price || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Dokumentationsbilleder</h2>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative">
                    <img src={img.image_url} alt={img.caption || ''} className="w-full h-32 object-cover rounded-lg" />
                    {img.caption && <div className="text-xs text-slate-500 mt-1 truncate">{img.caption}</div>}
                    <div className="text-xs text-slate-400">{img.phase} · {formatDate(img.upload_date)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dækningsgrad summary */}
          <div className={`rounded-xl p-5 ${dækningsgrad !== null && dækningsgrad < 0 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <div className="flex items-center gap-3">
              {dækningsgrad !== null && dækningsgrad < 0 ? (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              )}
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  Dækningsgrad: {dækningsgrad === null ? 'Ingen omsætning registreret' : `${dækningsgrad}%`}
                </div>
                <div className="text-sm text-slate-500">
                  {dækningsgrad !== null && dækningsgrad < 0
                    ? `Overskridelse med ${formatDKK(Math.abs(profit))} – projektet taber penge`
                    : `Resultat: ${formatDKK(profit)} (${totalHours} timer + ${materials.length} materialer)`}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}