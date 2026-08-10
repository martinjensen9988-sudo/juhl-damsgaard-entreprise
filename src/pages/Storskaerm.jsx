import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import Clock from '@/components/storskaerm/Clock';
import Panel from '@/components/storskaerm/Panel';
import Metrics from '@/components/storskaerm/Metrics';
import Tasks from '@/components/storskaerm/Tasks';
import Vehicles from '@/components/storskaerm/Vehicles';
import Projects from '@/components/storskaerm/Projects';
import Feeds from '@/components/storskaerm/Feeds';
import { HardHat, ListChecks, Truck, Activity } from 'lucide-react';

export default function Storskaerm() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [projects, quotes, invoices, equipment, tasks, assignments, activity, safety, services] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Quote.list(),
        base44.entities.Invoice.list(),
        base44.entities.Equipment.list(),
        base44.entities.Task.list(),
        base44.entities.Assignment.list(),
        base44.entities.ActivityLog.list('-created_date', 15),
        base44.entities.SafetyLog.list('-created_date', 10),
        base44.entities.ServiceAgreement.list(),
      ]);
      setData({ projects, quotes, invoices, equipment, tasks, assignments, activity, safety, services });
    } catch (e) {
      console.error('Storskaerm load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 60000);
    return () => clearInterval(t);
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const lineTotal = (items = []) => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  const activeProjects = data.projects.filter((p) => p.status === 'I gang').length;
  const openQuotes = data.quotes.filter((q) => q.status === 'Sendt' || q.status === 'Kladde');
  const quoteValue = openQuotes.reduce((s, q) => s + lineTotal(q.line_items), 0);
  const outstandingInvoices = data.invoices.filter((i) => i.status === 'Sendt' || i.status === 'Forfalden');
  const invoiceAmount = outstandingInvoices.reduce((s, i) => s + lineTotal(i.line_items), 0);

  const vehicles = data.equipment.filter((e) => e.category === 'Køretøj');
  const vehiclesInUse = vehicles.filter((v) => v.status === 'I brug').length;

  const todaysAssignments = data.assignments.filter((a) => a.date === todayStr);
  const todaysTasks = data.tasks.filter((t) => t.due_date === todayStr);

  const openSafety = data.safety.filter((s) => s.status === 'Åben' || s.status === 'Under behandling');

  // Build deadlines
  const deadlines = [];
  const now = Date.now();
  data.quotes.filter((q) => q.status === 'Sendt' && q.valid_until).forEach((q) => {
    const days = Math.ceil((new Date(q.valid_until).getTime() - now) / 86400000);
    if (days >= 0 && days <= 14) {
      deadlines.push({ type: 'Tilbud', label: q.customer_name || q.quote_number, sortDate: new Date(q.valid_until).getTime(), date: formatDate(q.valid_until), tagBg: 'bg-blue-400/10', tagText: 'text-blue-400' });
    }
  });
  data.invoices.filter((i) => (i.status === 'Sendt' || i.status === 'Forfalden') && i.due_date).forEach((i) => {
    const days = Math.ceil((new Date(i.due_date).getTime() - now) / 86400000);
    if (days <= 14) {
      const overdue = days < 0;
      deadlines.push({ type: 'Faktura', label: i.customer_name || i.invoice_number, sortDate: new Date(i.due_date).getTime(), date: formatDate(i.due_date), tagBg: overdue ? 'bg-red-400/10' : 'bg-emerald-400/10', tagText: overdue ? 'text-red-400' : 'text-emerald-400' });
    }
  });
  data.services.filter((s) => s.status === 'Aktiv' && s.next_service_date).forEach((s) => {
    const days = Math.ceil((new Date(s.next_service_date).getTime() - now) / 86400000);
    if (days >= 0 && days <= 30) {
      deadlines.push({ type: 'Service', label: s.title, sortDate: new Date(s.next_service_date).getTime(), date: formatDate(s.next_service_date), tagBg: 'bg-cyan-400/10', tagText: 'text-cyan-400' });
    }
  });
  deadlines.sort((a, b) => a.sortDate - b.sortDate);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden" style={{ zoom: 2 }}>
      <Clock />
      <div className="flex-1 p-5 flex flex-col gap-5 min-h-0">
        <Metrics
          activeProjects={activeProjects}
          openQuotes={openQuotes.length}
          quoteValue={quoteValue}
          outstandingInvoices={outstandingInvoices.length}
          invoiceAmount={invoiceAmount}
          vehiclesInUse={vehiclesInUse}
          totalVehicles={vehicles.length}
        />
        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
          <Panel title="Køretøjer & materiel" icon={Truck} accent="violet" className="col-span-3">
            <Vehicles equipment={data.equipment} />
          </Panel>
          <Panel title="Dagens opgaver" icon={ListChecks} accent="amber" className="col-span-3">
            <Tasks assignments={todaysAssignments} tasks={todaysTasks} />
          </Panel>
          <Panel title="Aktive projekter" icon={HardHat} accent="amber" className="col-span-3">
            <Projects projects={data.projects} />
          </Panel>
          <Panel title="Aktivitet & deadlines" icon={Activity} accent="blue" className="col-span-3">
            <Feeds activity={data.activity} safety={openSafety} deadlines={deadlines.slice(0, 10)} />
          </Panel>
        </div>
      </div>
    </div>
  );
}