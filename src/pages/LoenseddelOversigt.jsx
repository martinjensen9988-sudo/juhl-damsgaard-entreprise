import { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Users } from 'lucide-react';
import { formatDKK } from '@/lib/format';

const MONTHS = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];

export default function LoenseddelOversigt() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth());
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      try {
        const [emps, times] = await Promise.all([
          base44.entities.Employee.list('-created_date', 200),
          base44.entities.TimeEntry.list('-created_date', 500),
        ]);
        setEmployees(emps); setTimeEntries(times);
      } catch (e) { toast({ title: 'Fejl', description: e.message, variant: 'destructive' }); }
      finally { setLoading(false); }
    })();
  }, []);

  const data = useMemo(() => {
    return employees.map((emp) => {
      const entries = timeEntries.filter((t) => {
        if (t.user_name !== emp.name) return false;
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return false;
        return d.getMonth() === periodMonth && d.getFullYear() === periodYear;
      });
      const hours = entries.reduce((s, t) => s + (Number(t.hours) || 0), 0);
      const byType = {};
      entries.forEach((t) => { byType[t.task_type] = (byType[t.task_type] || 0) + (Number(t.hours) || 0); });
      const rate = Number(emp.hourly_rate) || 0;
      const brutto = hours * rate;
      const amBidrag = brutto * 0.08; // ATP-arbejdsgiverbidrag ~8%
      const feriepengProcent = brutto * 0.125;
      return { employee: emp, hours, byType, brutto, amBidrag, feriepengProcent, totalLoen: brutto + amBidrag + feriepengProcent, entries };
    }).filter((d) => d.hours > 0);
  }, [employees, timeEntries, periodMonth, periodYear]);

  const totalHours = data.reduce((s, d) => s + d.hours, 0);
  const totalBrutto = data.reduce((s, d) => s + d.brutto, 0);
  const totalLoen = data.reduce((s, d) => s + d.totalLoen, 0);

  function exportCsv() {
    const rows = [['Medarbejder', 'Fag', 'Timer', 'Timepris', 'Bruttoløn', 'AM-bidrag', 'Feriepenge', 'Total lønomkostning']];
    data.forEach((d) => {
      rows.push([d.employee.name, d.employee.trade || '', d.hours.toFixed(2), d.employee.hourly_rate || 0, Math.round(d.brutto), Math.round(d.amBidrag), Math.round(d.feriepengProcent), Math.round(d.totalLoen)]);
    });
    rows.push(['TOTAL', '', totalHours.toFixed(2), '', Math.round(totalBrutto), '', '', Math.round(totalLoen)]);
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `loenseddel-${periodYear}-${periodMonth + 1}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Eksporteret', description: 'Lønseddelsgrundlag downloadet' });
  }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Lønseddel Oversigt</h1>
          <p className="text-slate-500 mt-1">Grundlag for lønsedler baseret på tidsregistrering pr. medarbejder</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">Måned</Label>
            <Select value={String(periodMonth)} onValueChange={(v) => setPeriodMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">År</Label>
            <Input type="number" value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} className="w-24" />
          </div>
          <Button onClick={exportCsv}><Download className="w-4 h-4 mr-1" /> Eksportér</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-slate-500">Total timer</div><div className="text-2xl font-bold">{totalHours.toFixed(1)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-slate-500">Bruttoløn</div><div className="text-2xl font-bold">{formatDKK(totalBrutto)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-slate-500">Total lønomkostning</div><div className="text-2xl font-bold">{formatDKK(totalLoen)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Medarbejdere — {MONTHS[periodMonth]} {periodYear}</CardTitle></CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Ingen tidsregistreringer for denne periode</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-3">Medarbejder</th>
                    <th className="py-2 pr-3">Fag</th>
                    <th className="py-2 pr-3 text-right">Timer</th>
                    <th className="py-2 pr-3 text-right">Timepris</th>
                    <th className="py-2 pr-3 text-right">Brutto</th>
                    <th className="py-2 pr-3 text-right">AM-bidrag</th>
                    <th className="py-2 pr-3 text-right">Feriepenge</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d) => (
                    <tr key={d.employee.id} className="border-b border-slate-50">
                      <td className="py-2.5 pr-3 font-medium text-slate-900">{d.employee.name}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{d.employee.trade || '—'}</td>
                      <td className="py-2.5 pr-3 text-right">{d.hours.toFixed(1)}</td>
                      <td className="py-2.5 pr-3 text-right">{d.employee.hourly_rate ? formatDKK(d.employee.hourly_rate) : '—'}</td>
                      <td className="py-2.5 pr-3 text-right">{formatDKK(d.brutto)}</td>
                      <td className="py-2.5 pr-3 text-right text-slate-500">{formatDKK(d.amBidrag)}</td>
                      <td className="py-2.5 pr-3 text-right text-slate-500">{formatDKK(d.feriepengProcent)}</td>
                      <td className="py-2.5 text-right font-semibold">{formatDKK(d.totalLoen)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-bold">
                    <td colSpan={2} className="py-2.5">TOTAL</td>
                    <td className="py-2.5 pr-3 text-right">{totalHours.toFixed(1)}</td>
                    <td></td>
                    <td className="py-2.5 pr-3 text-right">{formatDKK(totalBrutto)}</td>
                    <td></td><td></td>
                    <td className="py-2.5 text-right">{formatDKK(totalLoen)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}