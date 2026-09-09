import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, FileText, Receipt, Users, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatDKK } from '@/lib/format';

export default function Kundestatistik() {
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('revenue');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, p, q, i] = await Promise.all([
          base44.entities.Customer.list(),
          base44.entities.Project.list(),
          base44.entities.Quote.list(),
          base44.entities.Invoice.list(),
        ]);
        setCustomers(c);
        setProjects(p);
        setQuotes(q);
        setInvoices(i);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const calcInvoiceTotal = (inv) => (inv.line_items || []).reduce((s, li) => s + (li.quantity || 0) * (li.unit_price || 0), 0);

  const stats = customers.map((c) => {
    const custProjects = projects.filter((p) => p.customer_id === c.id);
    const custQuotes = quotes.filter((q) => q.customer_id === c.id);
    const custInvoices = invoices.filter((i) => i.customer_id === c.id);
    const totalRevenue = custInvoices.filter((i) => i.status === 'Betalt').reduce((s, i) => s + calcInvoiceTotal(i), 0);
    const outstanding = custInvoices.filter((i) => i.status === 'Sendt' || i.status === 'Forfalden').reduce((s, i) => s + (calcInvoiceTotal(i) - (i.paid_amount || 0)), 0);
    const acceptedQuotes = custQuotes.filter((q) => q.status === 'Accepteret').length;
    const totalQuotes = custQuotes.length;
    const winRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;
    return {
      ...c,
      projectCount: custProjects.length,
      activeProjects: custProjects.filter((p) => p.status === 'I gang').length,
      totalQuotes,
      acceptedQuotes,
      winRate,
      totalRevenue,
      outstanding,
      invoiceCount: custInvoices.length,
    };
  });

  const filtered = stats.filter((s) => (s.company || s.name || '').toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
    if (sortBy === 'projects') return b.projectCount - a.projectCount;
    if (sortBy === 'outstanding') return b.outstanding - a.outstanding;
    if (sortBy === 'winRate') return b.winRate - a.winRate;
    return 0;
  });

  const totalRev = sorted.reduce((s, c) => s + c.totalRevenue, 0);
  const totalOut = sorted.reduce((s, c) => s + c.outstanding, 0);
  const totalProjects = sorted.reduce((s, c) => s + c.projectCount, 0);
  const avgWinRate = sorted.length > 0 ? Math.round(sorted.reduce((s, c) => s + c.winRate, 0) / sorted.length) : 0;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-amber-500" /> Kundestatistik</h1>
        <p className="text-sm text-slate-500 mt-1">Omsætning, projekter og betalingshistorik pr. kunde</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><TrendingUp className="w-4 h-4" /> Total omsætning</div>
          <div className="text-xl font-bold text-emerald-600">{formatDKK(totalRev)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Receipt className="w-4 h-4" /> Udestående</div>
          <div className="text-xl font-bold text-amber-600">{formatDKK(totalOut)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Users className="w-4 h-4" /> Projekter i alt</div>
          <div className="text-xl font-bold text-slate-900">{totalProjects}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><FileText className="w-4 h-4" /> Gennemsnit win-rate</div>
          <div className="text-xl font-bold text-slate-900">{avgWinRate}%</div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Søg kunde..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Sortér efter omsætning</SelectItem>
            <SelectItem value="projects">Sortér efter projekter</SelectItem>
            <SelectItem value="outstanding">Sortér efter udestående</SelectItem>
            <SelectItem value="winRate">Sortér efter win-rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {sorted.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{c.company || c.name}</div>
                    <div className="text-xs text-slate-500">{c.email} {c.payment_terms && `• ${c.payment_terms}`}</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8">
                <div>
                  <div className="text-xs text-slate-400">Omsætning</div>
                  <div className="font-bold text-emerald-600 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" />{formatDKK(c.totalRevenue)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Udestående</div>
                  <div className="font-bold text-amber-600 flex items-center gap-1"><ArrowDownRight className="w-3.5 h-3.5" />{formatDKK(c.outstanding)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Projekter</div>
                  <div className="font-bold text-slate-900">{c.projectCount} <span className="text-xs font-normal text-slate-400">({c.activeProjects} aktive)</span></div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Win-rate</div>
                  <div className="font-bold text-slate-900">{c.winRate}% <span className="text-xs font-normal text-slate-400">({c.acceptedQuotes}/{c.totalQuotes})</span></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-slate-400">Ingen kunder fundet</div>
        )}
      </div>
    </div>
  );
}