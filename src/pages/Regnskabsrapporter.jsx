import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { loadAccounts, loadPostedEntries, accountMap, computeResultat, computeBalance } from '@/lib/accounting';
import { FileBarChart, FileDown } from 'lucide-react';

function fmt(n) { return (n || 0).toLocaleString('da-DK', { minimumFractionDigits: 0 }); }

export default function Regnskabsrapporter() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [tab, setTab] = useState('resultat');

  const load = useCallback(async () => {
    const [e, a] = await Promise.all([loadPostedEntries(), loadAccounts()]);
    setEntries(e); setAccounts(a);
  }, []);
  useEffect(() => { load(); }, [load]);

  const aMap = accountMap(accounts);
  const res = computeResultat(entries, year, aMap);
  const bal = computeBalance(entries, `${year}-12-31`, aMap);

  const [exporting, setExporting] = useState(false);
  const exportSkat = async () => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke('skatRapport', { type: 'annual', period: year });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `aarsregnskab-${year}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Kunne ikke generere rapport'); }
    finally { setExporting(false); }
  };
  const yearOptions = [];
  const now = new Date().getFullYear();
  for (let y = now + 1; y >= now - 3; y--) yearOptions.push(String(y));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileBarChart className="w-6 h-6" /> Regnskabsrapporter</h1>
          <p className="text-sm text-muted-foreground">Resultatopgørelse og balance baseret på bogførte posteringer.</p>
        </div>
        <div className="flex items-end gap-3">
          <div><Label>Regnskabsår</Label><Select value={year} onValueChange={setYear}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
          <Button variant="outline" onClick={exportSkat} disabled={exporting}><FileDown className="w-4 h-4" /> {exporting ? 'Genererer…' : 'SKAT-klar eksport'}</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'resultat' ? 'default' : 'outline'} onClick={() => setTab('resultat')}>Resultatopgørelse</Button>
        <Button variant={tab === 'balance' ? 'default' : 'outline'} onClick={() => setTab('balance')}>Balance</Button>
      </div>

      {tab === 'resultat' && (
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <h3 className="font-semibold">Resultatopgørelse {year}</h3>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Driftsindtægter</div>
            {res.drif.filter((r) => r.type === 'Indtægt').map((r) => (
              <div key={r.account_number} className="flex justify-between text-sm pl-4"><span>{r.account_number} {r.name}</span><span className="font-mono">{fmt(r.amount)}</span></div>
            ))}
            <div className="flex justify-between font-semibold text-emerald-700"><span>Sum driftsindtægter</span><span className="font-mono">{fmt(res.driftsindtaegt)}</span></div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Driftsomkostninger</div>
            {res.drif.filter((r) => r.type === 'Omkostning').map((r) => (
              <div key={r.account_number} className="flex justify-between text-sm pl-4"><span>{r.account_number} {r.name}</span><span className="font-mono">{fmt(r.amount)}</span></div>
            ))}
            <div className="flex justify-between font-semibold text-red-700"><span>Sum driftsomkostninger</span><span className="font-mono">{fmt(res.driftsomkostning)}</span></div>
          </div>
          <div className="flex justify-between font-bold border-t pt-2"><span>Driftsresultat</span><span className="font-mono">{fmt(res.driftsresultat)}</span></div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Finansielle poster</div>
            {res.fin.map((r) => (
              <div key={r.account_number} className="flex justify-between text-sm pl-4"><span>{r.account_number} {r.name}</span><span className="font-mono">{fmt(r.amount)}</span></div>
            ))}
          </div>
          <div className="flex justify-between font-bold border-t pt-2 text-lg"><span>Årets resultat</span><span className="font-mono">{fmt(res.aaretsResultat)}</span></div>
        </div>
      )}

      {tab === 'balance' && (
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <h3 className="font-semibold">Balance pr. 31/12 {year}</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Aktiver</div>
              {bal.aktiver.map((r) => (
                <div key={r.account_number} className="flex justify-between text-sm"><span>{r.account_number} {r.name}</span><span className="font-mono">{fmt(r.amount)}</span></div>
              ))}
              <div className="flex justify-between font-bold border-t pt-1"><span>Sum aktiver</span><span className="font-mono">{fmt(bal.sumAktiver)}</span></div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Passiver</div>
              {bal.passiver.map((r) => (
                <div key={r.account_number} className="flex justify-between text-sm"><span>{r.account_number} {r.name}</span><span className="font-mono">{fmt(r.amount)}</span></div>
              ))}
              <div className="flex justify-between font-bold border-t pt-1"><span>Sum passiver</span><span className="font-mono">{fmt(bal.sumPassiver)}</span></div>
            </div>
          </div>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Balance (aktiver − passiver)</span>
            <span className={`font-mono ${Math.abs(bal.balance) < 0.01 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(bal.balance)} {Math.abs(bal.balance) < 0.01 ? '✓' : '✗'}</span>
          </div>
        </div>
      )}
    </div>
  );
}