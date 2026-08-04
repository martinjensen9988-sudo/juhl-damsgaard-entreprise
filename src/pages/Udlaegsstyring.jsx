import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Receipt, Plus, Upload, Trash2, Download, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const CATEGORIES = ['Materialer', 'Maskiner', 'Transport', 'Lønninger', 'Brændstof', 'Forsikring', 'Værktøj', 'Kontor', 'Markedsføring', 'Andet'];
const STATUS_BADGE = {
  Afventer: 'bg-slate-100 text-slate-600', Godkendt: 'bg-emerald-100 text-emerald-700',
  Afvist: 'bg-red-100 text-red-700', Bogført: 'bg-blue-100 text-blue-700',
};
const STATUS_ICON = { Afventer: Clock, Godkendt: CheckCircle2, Afvist: XCircle, Bogført: FileText };
const empty = { title: '', category: 'Materialer', amount: '', date: '', project_id: '', project_name: '', supplier_name: '', receipt_url: '', notes: '' };

export default function Udlaegsstyring() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    try {
      const [ex, p] = await Promise.all([
        base44.entities.Expense.list('-created_date', 500),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setItems(ex); setProjects(p);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((e) => filterStatus === 'all' || e.approval_status === filterStatus);
  const total = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pending = items.filter((e) => e.approval_status === 'Afventer').reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const onFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm((f) => ({ ...f, receipt_url: file_url })); }
    catch (err) { console.error(err); } finally { setUploading(false); }
  };
  const setProject = (id) => { const p = projects.find((x) => x.id === id); setForm((f) => ({ ...f, project_id: id, project_name: p?.name || '' })); };

  const save = async () => {
    if (!form.title || !form.amount) return;
    const payload = { ...form, amount: Number(form.amount), date: form.date || format(new Date(), 'yyyy-MM-dd'), approval_status: 'Afventer', submitted_by: '' };
    await base44.entities.Expense.create(payload);
    setOpen(false); setForm(empty); load();
  };
  const setStatus = async (e, status) => { await base44.entities.Expense.update(e.id, { approval_status: status }); load(); };
  const del = async (id) => { if (confirm('Slet udlæg?')) { await base44.entities.Expense.delete(id); load(); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Receipt className="w-7 h-7 text-amber-500" /> Udlægsstyring</h1>
          <p className="text-slate-500 mt-1">Upload kvitteringer for mindre indkøb og udgifter til korrekt refusion</p>
        </div>
        <Button onClick={() => { setForm(empty); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Nyt udlæg</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Total (alle)" value={`${total} kr`} />
        <Stat label="Til godkendelse" value={`${pending} kr`} />
        <Stat label="Antal poster" value={items.length} />
      </div>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="sm:w-56 bg-white"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Alle statusser</SelectItem>{['Afventer', 'Godkendt', 'Afvist', 'Bogført'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Ingen udlæg</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-3">Titel</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Dato</th>
                <th className="px-4 py-3">Beløb</th><th className="px-4 py-3">Kvittering</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => {
                const Icon = STATUS_ICON[e.approval_status] || Clock;
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-3"><div className="font-medium text-slate-900">{e.title}</div>{e.project_name && <div className="text-xs text-slate-500">{e.project_name}</div>}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{e.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{e.date && format(new Date(e.date), 'dd. MMM yyyy', { locale: da })}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{e.amount} kr</td>
                    <td className="px-4 py-3">{e.receipt_url ? <a href={e.receipt_url} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button></a> : <span className="text-xs text-slate-300">—</span>}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[e.approval_status] || STATUS_BADGE.Afventer}`}><Icon className="w-3 h-3" /> {e.approval_status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {e.approval_status === 'Afventer' && <>
                          <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => setStatus(e, 'Godkendt')}>Godkend</Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setStatus(e, 'Afvist')}>Afvis</Button>
                        </>}
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => del(e.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nyt udlæg</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="F.eks. Skruer og beslag" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Beløb (DKK) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Leverandør</Label><Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} /></div>
            </div>
            <div><Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={setProject}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div>
              <Label>Kvittering *</Label>
              {form.receipt_url ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg"><FileText className="w-4 h-4" /> Kvittering uploadet <button onClick={() => setForm({ ...form, receipt_url: '' })} className="text-red-600 ml-auto">Fjern</button></div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg py-6 cursor-pointer hover:border-amber-400">
                  <Upload className="w-5 h-5 text-slate-400" /><span className="text-sm text-slate-500">{uploading ? 'Uploader…' : 'Upload kvittering'}</span>
                  <input type="file" className="hidden" onChange={onFile} />
                </label>
              )}
            </div>
            <div><Label>Bemærkning</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.title || !form.amount} className="bg-amber-500 hover:bg-amber-600">Indsend udlæg</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div>;
}