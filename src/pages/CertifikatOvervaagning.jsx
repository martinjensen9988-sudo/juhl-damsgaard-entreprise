import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Award, Plus, Pencil, Trash2, AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { formatDate } from '@/lib/format';

const TYPES = ['Maskinførerbevis', 'Førstehjælp', 'Arbejdsmiljø', 'Svejsebevis', 'Kranbevis', 'Truckbevis', 'Håndværk', 'Andet'];
const empty = { employee_id: '', employee_name: '', title: '', type: 'Andet', issue_date: '', expiry_date: '', file_url: '', notes: '' };
const WARN_DAYS = 60;

export default function CertifikatOvervaagning() {
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [c, e] = await Promise.all([base44.entities.Certificate.list('-expiry_date', 300), base44.entities.Employee.list().catch(() => [])]); setItems(c || []); setEmployees(e || []); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEdit(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEdit(s); setForm({ ...empty, ...s }); setOpen(true); };

  const status = (cert) => {
    if (!cert.expiry_date) return { label: 'Uden udløb', tone: 'slate', icon: CheckCircle2 };
    const days = Math.floor((new Date(cert.expiry_date) - new Date()) / 86400000);
    if (days < 0) return { label: `Udløbet ${Math.abs(days)} d`, tone: 'rose', icon: AlertTriangle };
    if (days <= WARN_DAYS) return { label: `Udløber om ${days} d`, tone: 'amber', icon: CalendarClock };
    return { label: `Gyldigt (${days} d)`, tone: 'emerald', icon: CheckCircle2 };
  };

  const counts = {
    expired: items.filter((c) => c.expiry_date && new Date(c.expiry_date) < new Date()).length,
    soon: items.filter((c) => { const d = c.expiry_date ? Math.floor((new Date(c.expiry_date) - new Date()) / 86400000) : 999; return d >= 0 && d <= WARN_DAYS; }).length,
    valid: items.filter((c) => { const d = c.expiry_date ? Math.floor((new Date(c.expiry_date) - new Date()) / 86400000) : 999; return d > WARN_DAYS; }).length,
  };

  const save = async () => {
    if (!form.title || !form.employee_name) { alert('Certifikat og medarbejder kræves'); return; }
    if (edit) await base44.entities.Certificate.update(edit.id, form);
    else await base44.entities.Certificate.create(form);
    setOpen(false); load();
  };
  const del = async (s) => { if (confirm('Slet certifikat?')) { await base44.entities.Certificate.delete(s.id); load(); } };

  const setEmployee = (name) => { const emp = employees.find((e) => e.name === name); setForm({ ...form, employee_name: name, employee_id: emp?.id || '' }); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><Award className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Certifikatovervågning</h1>
            <p className="text-slate-500">Automatisk besked når certifikater (truckkort, svejsebevis m.m.) nærmer sig udløb</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-slate-950"><Plus className="w-4 h-4" /> Tilføj</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Count tone="rose" label="Udløbet" value={counts.expired} />
        <Count tone="amber" label="Udløber snart" value={counts.soon} />
        <Count tone="emerald" label="Gyldige" value={counts.valid} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><Award className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen certifikater registreret.</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const st = status(c); const Icon = st.icon;
            const tones = { rose: 'bg-rose-50 text-rose-700 border-rose-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200', slate: 'bg-slate-50 text-slate-600 border-slate-200' };
            return (
              <div key={c.id} className={`rounded-xl border p-4 flex items-center justify-between flex-wrap gap-2 ${tones[st.tone]}`}>
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-semibold text-slate-900">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.employee_name} · {c.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{st.label}</div>
                    {c.expiry_date && <div className="text-xs text-slate-400">Udløb: {formatDate(c.expiry_date)}</div>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-white/50"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                    <button onClick={() => del(c)} className="p-1.5 rounded hover:bg-white/50"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{edit ? 'Rediger certifikat' : 'Nyt certifikat'}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Medarbejder</Label>
              <Select value={form.employee_name} onValueChange={setEmployee}><SelectTrigger className="mt-1"><SelectValue placeholder="Vælg medarbejder..." /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label className="text-xs">Certifikat *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="F.eks. Truckkort B" /></div>
            <div><Label className="text-xs">Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Udstedt</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
              <div><Label className="text-xs">Udløb</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Noter</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} className="bg-slate-950">Gem</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Count({ tone, label, value }) {
  const tones = { rose: 'bg-rose-50 text-rose-700 border-rose-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return <div className={`rounded-xl border p-4 ${tones[tone]}`}><div className="text-xs">{label}</div><div className="text-2xl font-bold">{value}</div></div>;
}