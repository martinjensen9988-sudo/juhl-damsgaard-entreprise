import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Palmtree, Plus, Check, X, Calendar } from 'lucide-react';

const TYPES = ['Ferie', 'Afspadsering', 'Sygdom', 'Fri', 'Andet'];
const today = new Date().toISOString().slice(0, 10);
const empty = { employee_name: '', employee_email: '', start_date: today, end_date: today, type: 'Ferie', status: 'Afventer', submitted_date: today, notes: '', manager_note: '' };
const statusBadge = { 'Afventer': 'bg-amber-100 text-amber-700', 'Godkendt': 'bg-emerald-100 text-emerald-700', 'Afvist': 'bg-red-100 text-red-700', 'Annulleret': 'bg-slate-100 text-slate-600' };

export default function FerieAdministration() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => { try { setRequests(await base44.entities.VacationRequest.list('-start_date')); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const submit = async () => { await base44.entities.VacationRequest.create(form); setDialogOpen(false); load(); };
  const setStatus = async (r, status) => { await base44.entities.VacationRequest.update(r.id, { status }); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  const pending = requests.filter((r) => r.status === 'Afventer');
  const days = (r) => Math.ceil((new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) / 86400000) + 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Ferieadministration</h1><p className="text-sm text-slate-500 mt-1">Indsend og godkend ferieønsker med overblik over dækning</p></div>
        <Button onClick={() => { setForm(empty); setDialogOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Ny anmodning</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Calendar className="w-4 h-4" /> Total anmodninger</div><div className="text-2xl font-bold text-slate-900">{requests.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Palmtree className="w-4 h-4" /> Afventer godkendelse</div><div className="text-2xl font-bold text-amber-600">{pending.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Check className="w-4 h-4" /> Godkendte</div><div className="text-2xl font-bold text-emerald-600">{requests.filter((r) => r.status === 'Godkendt').length}</div></div>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Palmtree className="w-5 h-5 text-slate-600" /></div>
              <div>
                <div className="font-semibold text-slate-900">{r.employee_name}</div>
                <div className="text-sm text-slate-500">{formatDate(r.start_date)} → {formatDate(r.end_date)} • {days(r)} dag(e) • {r.type}</div>
                {r.notes && <div className="text-xs text-slate-400 mt-1">{r.notes}</div>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge[r.status] || statusBadge['Afventer']}`}>{r.status}</span>
              {r.status === 'Afventer' && (
                <div className="flex gap-1">
                  <button onClick={() => setStatus(r, 'Godkendt')} className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-700"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setStatus(r, 'Afvist')} className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-700"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {requests.length === 0 && <div className="text-center py-16 text-slate-400"><Palmtree className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Ingen ferieanmodninger</p></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ny ferieanmodning</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Medarbejder *</Label><Input value={form.employee_name} onChange={(e) => set('employee_name', e.target.value)} /></div>
            <div><Label>Startdato</Label><Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} /></div>
            <div><Label>Slutdato</Label><Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} /></div>
            <div className="col-span-2"><Label>Type</Label><Select value={form.type} onValueChange={(v) => set('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Bemærkning</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={submit} disabled={!form.employee_name}>Indsend</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}