import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Award, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

const TYPES = ['Maskinførerbevis', 'Førstehjælp', 'Arbejdsmiljø', 'Svejsebevis', 'Kranbevis', 'Truckbevis', 'Håndværk', 'Andet'];

const EMPTY = { employee_id: '', employee_name: '', title: '', type: 'Andet', issue_date: '', expiry_date: '', file_url: '', notes: '' };

export default function Certifikater() {
  const [certs, setCerts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, e] = await Promise.all([
        base44.entities.Certificate.list('-created_date', 200),
        base44.entities.Employee.list('-created_date', 200),
      ]);
      setCerts(c); setEmployees(e);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getCertStatus = (cert) => {
    if (!cert.expiry_date) return { key: 'valid', label: 'Gyldig', style: 'bg-slate-100 text-slate-600', icon: CheckCircle2 };
    const now = new Date();
    const expiry = new Date(cert.expiry_date);
    const daysUntil = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return { key: 'expired', label: 'Udløbet', style: 'bg-red-100 text-red-700', icon: AlertTriangle };
    if (daysUntil <= 60) return { key: 'expiring', label: `Udløber (${daysUntil}d)`, style: 'bg-amber-100 text-amber-700', icon: AlertTriangle };
    return { key: 'valid', label: 'Gyldig', style: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
  };

  const filtered = filter === 'all' ? certs : certs.filter((c) => getCertStatus(c).key === filter);

  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (c) => { setForm({ ...EMPTY, ...c }); setEditing(c); setDialogOpen(true); };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, file_url: res.file_url });
    } catch (e) { console.error(e); alert('Upload fejlede'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const emp = employees.find((e) => e.id === form.employee_id);
      const payload = { ...form, employee_name: emp?.name || form.employee_name };
      if (editing) await base44.entities.Certificate.update(editing.id, payload);
      else await base44.entities.Certificate.create(payload);
      setDialogOpen(false); load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { if (confirm('Slet certifikat?')) { await base44.entities.Certificate.delete(id); load(); } };
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;

  const expiredCount = certs.filter((c) => getCertStatus(c).key === 'expired').length;
  const expiringCount = certs.filter((c) => getCertStatus(c).key === 'expiring').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Certifikater</h1>
          <p className="text-slate-500 mt-1">Medarbejdernes certifikater og udløbsdatoer</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Tilføj</Button>
      </div>

      {(expiredCount > 0 || expiringCount > 0) && (
        <div className={`rounded-xl p-4 border ${expiredCount > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${expiredCount > 0 ? 'text-red-500' : 'text-amber-500'}`} />
            <span className="text-sm font-medium text-slate-700">
              {expiredCount > 0 && `${expiredCount} udløbet certifikat(er) · `}
              {expiringCount > 0 && `${expiringCount} certifikat(er) udløber snart`}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {['all', 'expired', 'expiring', 'valid'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s === 'all' ? 'Alle' : s === 'expired' ? 'Udløbet' : s === 'expiring' ? 'Udløber snart' : 'Gyldige'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen certifikater registreret.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const status = getCertStatus(c);
            const Icon = status.icon;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-900">{c.title}</div>
                    <div className="text-sm text-slate-500">{c.employee_name}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.style}`}>
                    <Icon className="w-3 h-3" /> {status.label}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  <div>Type: {c.type}</div>
                  {c.issue_date && <div>Udstedt: {formatDate(c.issue_date)}</div>}
                  {c.expiry_date && <div>Udløb: {formatDate(c.expiry_date)}</div>}
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-50">
                  {c.file_url ? (
                    <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Se fil
                    </a>
                  ) : <span className="text-xs text-slate-300">Ingen fil</span>}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger certifikat' : 'Nyt certifikat'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Medarbejder</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg medarbejder" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Certifikat *</Label><Input value={form.title} onChange={set('title')} placeholder="F.eks. Maskinførerbevis" /></div>
            <div className="space-y-1.5"><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Udstedt</Label><Input type="date" value={form.issue_date || ''} onChange={set('issue_date')} /></div>
            <div className="space-y-1.5"><Label>Udløb</Label><Input type="date" value={form.expiry_date || ''} onChange={set('expiry_date')} /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Certifikatfil</Label>
              {form.file_url ? (
                <div className="flex items-center gap-2">
                  <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">Fil uploaded</a>
                  <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, file_url: '' })}>Fjern</Button>
                </div>
              ) : (
                <label className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg py-4 cursor-pointer hover:border-slate-300">
                  <span className="text-sm text-slate-500">{uploading ? 'Uploader...' : 'Upload fil'}</span>
                  <input type="file" className="hidden" onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} disabled={uploading} />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.title}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}