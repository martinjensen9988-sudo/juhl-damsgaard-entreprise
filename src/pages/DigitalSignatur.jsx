import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Send, FileText, PenLine, X, Clock, CheckCircle2, Loader2 } from 'lucide-react';

const STATUS_STYLE = {
  Kladde: 'bg-slate-100 text-slate-700',
  Sendt: 'bg-blue-50 text-blue-700',
  Underskrevet: 'bg-emerald-50 text-emerald-700',
  Afvist: 'bg-red-50 text-red-700',
  'Udløbet': 'bg-amber-50 text-amber-700',
};

const EMPTY = {
  title: '', customer_name: '', customer_email: '', project_name: '', document_url: '',
  expires_date: '', notes: '',
};

export default function DigitalSignatur() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [data, proj] = await Promise.all([
        base44.entities.SignatureRequest.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 100),
      ]);
      setItems(data);
      setProjects(proj);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, document_url: file_url }));
      toast({ title: 'Dokument uploadet' });
    } catch (e) {
      toast({ title: 'Upload fejlede', description: e.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const openNew = () => { setForm(EMPTY); setOpen(true); };

  const send = async () => {
    if (!form.title || !form.customer_email) {
      toast({ title: 'Udfyld titel og kundeemail', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.SignatureRequest.create({
        ...form,
        status: 'Sendt',
        sent_date: new Date().toISOString().slice(0, 10),
      });
      setOpen(false);
      load();
      toast({ title: 'Anmodning sendt til underskrift' });
    } catch (e) {
      toast({ title: 'Fejl', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const markSigned = async (item) => {
    await base44.entities.SignatureRequest.update(item.id, {
      status: 'Underskrevet',
      signed_date: new Date().toISOString().slice(0, 10),
      signed_by: item.customer_name || item.customer_email,
    });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Slet denne anmodning?')) return;
    await base44.entities.SignatureRequest.delete(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Digital underskrift</h1>
          <p className="text-slate-500 mt-1">Send dokumenter til hurtig digital godkendelse hos kunden</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Ny anmodning
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <PenLine className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen anmodninger endnu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 truncate">{it.title}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[it.status] || 'bg-slate-100'}`}>{it.status}</span>
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {it.customer_name || it.customer_email} {it.project_name ? `• ${it.project_name}` : ''}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  {it.sent_date && <span className="flex items-center gap-1"><Send className="w-3 h-3" /> Sendt {it.sent_date}</span>}
                  {it.signed_date && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Underskrevet {it.signed_date}</span>}
                  {it.expires_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Udløber {it.expires_date}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {it.document_url && (
                  <a href={it.document_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-1" /> Vis</Button>
                  </a>
                )}
                {it.status === 'Sendt' && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => markSigned(it)}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Marker underskrevet
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => remove(it.id)}><X className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Ny anmodning om digital underskrift</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Titel *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kontrakt, tilbud, afleveringsprotokol mv." />
            </div>
            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Kundeemail *</Label>
              <Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Projekt (valgfrit)</Label>
              <Input list="proj-list" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
              <datalist id="proj-list">{projects.map((p) => <option key={p.id} value={p.name} />)}</datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Udløber</Label>
              <Input type="date" value={form.expires_date} onChange={(e) => setForm({ ...form, expires_date: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Dokument</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={(e) => upload(e.target.files?.[0])} disabled={uploading} className="flex-1" />
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </div>
              {form.document_url && <p className="text-xs text-emerald-600 truncate">Uploadet: {form.document_url}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Noter</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={send} disabled={saving || uploading}>{saving ? 'Sender...' : 'Send til underskrift'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}