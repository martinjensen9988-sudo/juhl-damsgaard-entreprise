import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BookOpen, LayoutGrid, Receipt, FileBarChart, Calculator } from 'lucide-react';

export default function RegnskabDashboard() {
  const [stats, setStats] = useState({ accounts: 0, entries: 0, posted: 0, vatReports: 0, lastVat: null });

  useEffect(() => {
    (async () => {
      const [a, e, v] = await Promise.all([
        base44.entities.Account.list('account_number', 500).catch(() => []),
        base44.entities.JournalEntry.list('-date', 2000).catch(() => []),
        base44.entities.VatReport.list('-created_date', 50).catch(() => []),
      ]);
      setStats({
        accounts: (a || []).length,
        entries: (e || []).length,
        posted: (e || []).filter((x) => x.status === 'Bogført').length,
        vatReports: (v || []).length,
        lastVat: (v || [])[0] || null,
      });
    })();
  }, []);

  const cards = [
    { to: '/regnskab-kontoplan', label: 'Kontoplan', desc: 'Skattedre konto-oversigten', icon: LayoutGrid, color: 'bg-blue-50 text-blue-700' },
    { to: '/regnskab-bogfoering', label: 'Bogføring', desc: 'Dobbelt bogholderi & kladder', icon: BookOpen, color: 'bg-emerald-50 text-emerald-700' },
    { to: '/regnskab-moms', label: 'Momsangivelse', desc: 'Moms efter dansk regler', icon: Receipt, color: 'bg-amber-50 text-amber-700' },
    { to: '/regnskab-rapporter', label: 'Rapporter', desc: 'Resultatopgørelse & balance', icon: FileBarChart, color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator className="w-6 h-6" /> Regnskab</h1>
        <p className="text-sm text-muted-foreground">Integreret regnskabsprogram med dansk kontoplan, dobbelt bogholderi og moms.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">Konti</div><div className="text-2xl font-bold">{stats.accounts}</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">Posteringer</div><div className="text-2xl font-bold">{stats.entries}</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">Bogførte</div><div className="text-2xl font-bold">{stats.posted}</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">Momsangivelser</div><div className="text-2xl font-bold">{stats.vatReports}</div></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to} className="rounded-lg border bg-card p-5 hover:border-primary transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}><Icon className="w-5 h-5" /></div>
                <div className="font-semibold">{c.label}</div>
              </div>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </Link>
          );
        })}
      </div>

      {stats.lastVat && (
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-semibold">Seneste momsangivelse: {stats.lastVat.period}</div>
          <div className="text-sm text-muted-foreground">Status: {stats.lastVat.status} • Moms at betale: {(stats.lastVat.payable_vat || 0).toLocaleString('da-DK')} DKK</div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Bemærk: Regnskabet understøtter dobbelt bogholderi og moms efter gældende danske regler. For endelig indberetning til SKAT anbefales kontrol af en autoriseret revisor/bogholder.</p>
    </div>
  );
}