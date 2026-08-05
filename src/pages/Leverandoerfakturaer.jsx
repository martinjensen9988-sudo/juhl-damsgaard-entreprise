import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate, formatDKK } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileCheck, Plus, Pencil, Trash2, Check, X, FileText, Clock, Upload, Paperclip, Loader2 } from 'lucide-react';

const STATUSES = ['Afventer', 'Godkendt', 'Afvist', 'Betalt'];
const CATEGORIES = ['Materialer', 'Maskiner', 'Transport', 'Lønninger', 'Brændstof', 'Forsikring', 'Værktøj', 'Kontor', 'Markedsføring', 'Andet'];
const statusBadge = { 'Afventer': 'bg-amber-100 text-amber-700', 'Godkendt': 'bg-emerald-100 text-emerald-700', 'Afvist': 'bg-red-100 text-red-700', 'Betalt': 'bg-blue-100 text-blue-700' };
const today = new Date().toISOString().slice(0, 10);
const empty = { invoice_number: '', supplier_name: '', project_id: '', project_name: '', amount: 0, vat_amount: 0, date: today, due_date: '', status: 'Afventer', category: 'Materialer', description: '', file_url: '', approved_by: '', notes: '' };

export default function Leverandoerfakturaer() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);
  const aiFileRef = React.useRef(null);

  const load = async () => { try { const [invData, projData] = await Promise.all([base44.entities.SupplierInvoice.list('-date'), base44.entities.Project.list('-created_date', 200)]); setInvoices(invData); setProjects(projData); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({ ...empty, ...i }); setDialogOpen(true); };
  const save = async () => { if (editing) await base44.entities.SupplierInvoice.update(editing.id, form); else await base44.entities.SupplierInvoice.create(form); setDialogOpen(false); load(); };
  const remove = async (id) => { if (!confirm('Slet faktura?')) return; await base44.entities.SupplierInvoice.delete(id); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleUpload = async (file) => { if (!file) return; setUploading(true); try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); set('file_url', file_url); } catch (e) { console.error(e); } finally { setUploading(false); } };
  const handleAiScan = async (file) => {
    if (!file) return;
    setAiScanning(true);
    setAiMessage(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke('scanSupplierInvoice', { file_url });
      const data = res?.data || res;
      if (data?.error) { setAiMessage({ type: 'error', text: data.error }); }
      else {
        setAiMessage({
          type: 'success',
          text: `AI læste faktura${data.invoice?.invoice_number ? ' ' + data.invoice.invoice_number : ''} fra ${data.supplier_name}${data.supplier_created ? ' — ny leverandør oprettet' : ''}.`
        });
        await load();
      }
    } catch (e) {
      setAiMessage({ type: 'error', text: e?.message || 'Kunne ikke læse faktura' });
    } finally {
      setAiScanning(false);
      if (aiFileRef.current) aiFileRef.current.value = '';
    }
  };

  const [posting, setPosting] = useState(null);
  const setStatus = async (inv, status) => {
    if (status === 'Godkendt') {
      setPosting(inv.id);
      try {
        const res = await base44.functions.invoke('postSupplierInvoice', { invoice_id: inv.id });
        const data = res?.data || res;
        if (data?.error) { setAiMessage({ type: 'error', text: data.error }); }
        else { setAiMessage({ type: 'success', text: `Faktura ${inv.invoice_number} godkendt og bogført som bilag ${data?.journal_entry?.entry_number || ''} i regnskabet.` }); }
      } catch (e) {
        setAiMessage({ type: 'error', text: e?.message || 'Kunne ikke bogføre faktura' });
      } finally {
        setPosting(null);
        load();
      }
      return;
    }
    await base44.entities.SupplierInvoice.update(inv.id, { status });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  const pending = invoices.filter((i) => i.status === 'Afventer');
  const approved = invoices.filter((i) => i.status === 'Godkendt');
  const totalPending = pending.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalApproved = approved.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const filtered = projectFilter === 'all' ? invoices : invoices.filter((i) => i.project_id === projectFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Leverandørfakturaer</h1><p className="text-sm text-slate-500 mt-1">Registrering og godkendelse af fakturaer fra leverandører</p></div>
        <div className="flex items-center gap-2">
          <input ref={aiFileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => handleAiScan(e.target.files?.[0])} disabled={aiScanning} />
          <Button variant="outline" onClick={() => aiFileRef.current?.click()} disabled={aiScanning} className="gap-2 bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100">
            {aiScanning ? <><Loader2 className="w-4 h-4 animate-spin" /> AI læser...</> : <><Upload className="w-4 h-4" /> Upload & AI-læs</>}
          </Button>
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tilføj faktura</Button>
        </div>
      </div>

      {aiMessage && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${aiMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {aiMessage.text}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><FileCheck className="w-4 h-4" /> Total</div><div className="text-2xl font-bold text-slate-900">{invoices.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Clock className="w-4 h-4" /> Afventer</div><div className="text-2xl font-bold text-amber-600">{pending.length}</div><div className="text-xs text-slate-500 mt-1">{formatDKK(totalPending)}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Check className="w-4 h-4" /> Godkendte</div><div className="text-2xl font-bold text-emerald-600">{approved.length}</div><div className="text-xs text-slate-500 mt-1">{formatDKK(totalApproved)}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><FileText className="w-4 h-4" /> Betalte</div><div className="text-2xl font-bold text-blue-600">{invoices.filter((i) => i.status === 'Betalt').length}</div></div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Label className="text-slate-500 whitespace-nowrap">Filtrér efter projekt:</Label>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle projekter</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((inv) => (
          <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><FileText className="w-5 h-5 text-slate-600" /></div>
                <div>
                  <div className="font-semibold text-slate-900">{inv.invoice_number} — {inv.supplier_name}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{inv.project_name || '—'} • {inv.date ? formatDate(inv.date) : '—'}{inv.due_date ? ` • Forfald: ${formatDate(inv.due_date)}` : ''}</div>
                  {inv.category && <div className="text-xs text-slate-400 mt-0.5">{inv.category}</div>}
                {inv.description && <div className="text-xs text-slate-400 mt-1">{inv.description}</div>}
                {inv.journal_entry_id && <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Bogført som bilag</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{formatDKK(Number(inv.amount) || 0)}</div>
                {inv.vat_amount > 0 && <div className="text-xs text-slate-500 mt-0.5">+{formatDKK(Number(inv.vat_amount) || 0)} moms</div>}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[inv.status] || statusBadge['Afventer']} inline-block mt-1`}>{inv.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              {inv.status === 'Afventer' && (
                posting === inv.id ? (
                  <span className="text-sm text-slate-500 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Bogfører...</span>
                ) : (
                  <>
                    <button onClick={() => setStatus(inv, 'Godkendt')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Godkend og bogfør</button>
                    <button onClick={() => setStatus(inv, 'Afvist')} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"><X className="w-4 h-4" /> Afvis</button>
                  </>
                )
              )}
              {inv.status === 'Godkendt' && <button onClick={() => setStatus(inv, 'Betalt')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Marker betalt</button>}
              {inv.file_url && <a href={inv.file_url} target="_blank" rel="noreferrer" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 ml-auto"><FileText className="w-4 h-4" /> Vis fil</a>}
              <button onClick={() => openEdit(inv)} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 ml-auto"><Pencil className="w-3.5 h-3.5" /> Rediger</button>
              <button onClick={() => remove(inv.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-16 text-slate-400"><FileCheck className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Ingen leverandørfakturaer registreret</p></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger faktura' : 'Tilføj leverandørfaktura'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Fakturanr. *</Label><Input value={form.invoice_number} onChange={(e) => set('invoice_number', e.target.value)} /></div>
            <div><Label>Leverandør *</Label><Input value={form.supplier_name} onChange={(e) => set('supplier_name', e.target.value)} /></div>
            <div><Label>Beløb (DKK) *</Label><Input type="number" value={form.amount} onChange={(e) => set('amount', Number(e.target.value))} /></div>
            <div><Label>Moms (DKK)</Label><Input type="number" value={form.vat_amount} onChange={(e) => set('vat_amount', Number(e.target.value))} /></div>
            <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
            <div><Label>Forfaldsdato</Label><Input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} /></div>
            <div>
              <Label>Projekt</Label>
              <Select value={form.project_id || 'none'} onValueChange={(v) => { if (v === 'none') { set('project_id', ''); set('project_name', ''); } else { const p = projects.find((x) => x.id === v); set('project_id', v); set('project_name', p?.name || ''); } }}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Intet projekt</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Kategori</Label><Select value={form.category || 'Materialer'} onValueChange={(v) => set('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} /></div>
            <div className="col-span-2">
              <Label>Vedhæft faktura</Label>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors">
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploader...</> : <><Upload className="w-4 h-4" /> Upload fil</>}
                  </div>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => handleUpload(e.target.files?.[0])} disabled={uploading} />
                </label>
                {form.file_url && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                    <Paperclip className="w-4 h-4" />
                    <a href={form.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Vis fil</a>
                    <button type="button" onClick={() => set('file_url', '')} className="text-red-500 hover:text-red-700 ml-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.invoice_number || !form.supplier_name}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}