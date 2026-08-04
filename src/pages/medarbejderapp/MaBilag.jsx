import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Camera, X, Check, Clock, FileText } from 'lucide-react';

const KATEGORIER = ['Materialer', 'Maskiner', 'Transport', 'Brændstof', 'Værktøj', 'Kontor', 'Markedsføring', 'Forsikring', 'Andet'];
const STATUS = {
  Afventer: { icon: Clock, cls: 'bg-amber-100 text-amber-700' },
  Godkendt: { icon: Check, cls: 'bg-emerald-100 text-emerald-700' },
  Afvist: { icon: X, cls: 'bg-red-100 text-red-700' },
  Bogført: { icon: FileText, cls: 'bg-blue-100 text-blue-700' },
};

export default function MaBilag() {
  const { user } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [bilag, setBilag] = useState([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    title: '', category: 'Materialer', amount: '', date: new Date().toISOString().slice(0, 10),
    project_id: '', project_name: '', supplier_name: '', notes: '', receipt_url: '',
  });

  const load = useCallback(async () => {
    const [p, e] = await Promise.all([
      base44.entities.Project.list('-created_date', 200).catch(() => []),
      base44.entities.Expense.filter({}, '-created_date', 100).catch(() => []),
    ]);
    setProjects(p || []);
    setBilag(e || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const pickProject = (id) => {
    const p = projects.find((x) => x.id === id);
    setForm((f) => ({ ...f, project_id: id, project_name: p ? p.name || p.title : '' }));
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      setPreview(URL.createObjectURL(file));
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, receipt_url: file_url }));
    } catch (err) {
      alert('Kunne ikke uploade billede: ' + (err.message || 'fejl'));
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setForm({ title: '', category: 'Materialer', amount: '', date: new Date().toISOString().slice(0, 10), project_id: '', project_name: '', supplier_name: '', notes: '', receipt_url: '' });
    setOpen(false);
  };

  const submit = async () => {
    if (!form.receipt_url) { alert('Tag et billede af bilaget først'); return; }
    if (!form.project_id) { alert('Vælg et projekt'); return; }
    if (!form.amount || !form.title) { alert('Udfyld titel og beløb'); return; }
    setSaving(true);
    try {
      await base44.entities.Expense.create({
        ...form,
        amount: Number(form.amount),
        approval_status: 'Afventer',
        submitted_by: user?.full_name || user?.email || '',
      });
      reset();
      load();
    } catch (err) {
      alert('Kunne ikke gemme: ' + (err.message || 'fejl'));
    } finally {
      setSaving(false);
    }
  };

  const total = bilag.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Receipt className="w-5 h-5" /> Bilag</h1>
          <p className="text-xs text-muted-foreground">Tag billede af kvitteringer og send til bogføring.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Camera className="w-4 h-4" /> Ny bilag</Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-white p-3"><div className="text-xs text-muted-foreground">Indsendte bilag</div><div className="text-lg font-bold">{bilag.length}</div></div>
        <div className="rounded-lg border bg-white p-3"><div className="text-xs text-muted-foreground">Samlet beløb</div><div className="text-lg font-bold">{total.toLocaleString('da-DK')} DKK</div></div>
      </div>

      <div className="space-y-2">
        {bilag.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Ingen bilag endnu. Tryk "Ny bilag" for at starte.</p>}
        {bilag.map((b) => {
          const st = STATUS[b.approval_status] || STATUS.Afventer;
          const StIcon = st.icon;
          return (
            <div key={b.id} className="rounded-lg border bg-white p-3 flex gap-3">
              {b.receipt_url ? (
                <img src={b.receipt_url} alt="bilag" className="w-16 h-16 rounded object-cover bg-slate-100" />
              ) : (
                <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center"><Receipt className="w-6 h-6 text-slate-400" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm truncate">{b.title}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${st.cls}`}><StIcon className="w-3 h-3" /> {b.approval_status}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{b.project_name || 'Intet projekt'}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{b.date}</span>
                  <span className="text-sm font-semibold">{Number(b.amount || 0).toLocaleString('da-DK')} DKK</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end max-w-md mx-auto" onClick={reset}>
          <div className="bg-white w-full rounded-t-2xl p-4 space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Nyt bilag</h2>
              <button onClick={reset}><X className="w-5 h-5" /></button>
            </div>

            {!preview ? (
              <label className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50">
                <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <span className="text-sm font-medium">Tag billede af bilaget</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              </label>
            ) : (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-44 object-cover rounded-lg" />
                <button onClick={() => { setPreview(null); setForm((f) => ({ ...f, receipt_url: '' })); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                {uploading && <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center text-white text-sm">Uploader…</div>}
              </div>
            )}

            <div className="space-y-2">
              <div><Label>Projekt *</Label>
                <Select value={form.project_id} onValueChange={pickProject}>
                  <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name || p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="F.eks. byggemarked" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Beløb (DKK) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></div>
                <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
              </div>
              <div><Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KATEGORIER.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Leverandør</Label><Input value={form.supplier_name} onChange={(e) => setForm((f) => ({ ...f, supplier_name: e.target.value }))} /></div>
              <div><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            </div>

            <Button className="w-full" onClick={submit} disabled={saving || uploading || !form.receipt_url}>
              {saving ? 'Gemmer…' : 'Send til bogføring'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}