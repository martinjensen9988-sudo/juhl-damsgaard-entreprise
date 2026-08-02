import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload, ShieldAlert, FileText } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';

const damageTypes = ['Vandskade', 'Stormskade', 'Frostskade', 'Ildskade', 'Hærværk', 'Andet'];
const statuses = ['Oprettet', 'Under behandling', 'Godkendt', 'Afvist', 'Afsluttet'];
const statusColor = { Oprettet: 'bg-slate-100 text-slate-600', 'Under behandling': 'bg-blue-100 text-blue-700', Godkendt: 'bg-emerald-100 text-emerald-700', Afvist: 'bg-red-100 text-red-700', Afsluttet: 'bg-slate-200 text-slate-600' };
const empty = { case_number: '', customer_name: '', project_name: '', insurance_company: '', policy_number: '', damage_type: 'Andet', damage_date: '', description: '', before_photo_urls: [], after_photo_urls: [], report_url: '', status: 'Oprettet', estimated_amount: '', approved_amount: '', assigned_to: '', notes: '' };

export default function Forsikringssager() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');

  const load = async () => { setLoading(true); try { const c = await base44.entities.InsuranceCase.list(); setCases(c || []); } catch (e) { console.error(e); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const openCreate = () => { setEditing(null); setForm({ ...empty, case_number: `SKADE-${new Date().getFullYear()}-${String(cases.length + 1).padStart(4, '0')}`, damage_date: new Date().toISOString().split('T')[0] }); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...empty, ...c, before_photo_urls: c.before_photo_urls || [], after_photo_urls: c.after_photo_urls || [] }); setOpen(true); };

  const upload = async (e, field) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(field);
    try {
      if (field === 'report') { const { file_url } = await base44.integrations.Core.UploadFile({ file }); set('report_url', file_url); }
      else { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm((s) => ({ ...s, [field]: [...(s[field] || []), file_url] })); }
    } catch (err) { console.error(err); alert('Upload fejlede'); }
    setUploading('');
  };
  const removePhoto = (field, idx) => setForm((s) => ({ ...s, [field]: s[field].filter((_, i) => i !== idx) }));

  const save = async () => {
    if (!form.case_number) return alert('Angiv sagsnr.');
    setSaving(true);
    try { editing ? await base44.entities.InsuranceCase.update(editing.id, form) : await base44.entities.InsuranceCase.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (c) => { if (!confirm('Slet sag?')) return; try { await base44.entities.InsuranceCase.delete(c.id); load(); } catch (e) {} };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-red-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Forsikringssager</h1>
            <p className="text-slate-500 mt-0.5">Skadeservice med dokumentation, før-og-efter billeder og skadesrapporter</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Ny sag</Button>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : cases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen sager endnu</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{c.case_number}</div>{c.customer_name && <div className="text-xs text-slate-500 truncate">{c.customer_name}</div>}</div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || 'bg-slate-100'}`}>{c.status}</span>
              </div>
              <div className="flex items-center gap-2 mt-2"><span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{c.damage_type}</span><span className="text-xs text-slate-400">{formatDate(c.damage_date)}</span></div>
              {c.insurance_company && <div className="text-xs text-slate-500 mt-2">{c.insurance_company}{c.policy_number && ` · ${c.policy_number}`}</div>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                <span className="text-slate-500">Før: {c.before_photo_urls?.length || 0}</span>
                <span className="text-slate-500">Efter: {c.after_photo_urls?.length || 0}</span>
                {c.report_url && <span className="text-blue-600 flex items-center gap-0.5"><FileText className="w-3 h-3" /> Rapport</span>}
                {c.estimated_amount > 0 && <span className="text-slate-700 font-medium">Est: {formatDKK(c.estimated_amount)}</span>}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(c)} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Pencil className="w-3 h-3" /> Rediger</button>
                <button onClick={() => remove(c)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /> Slet</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger sag' : 'Ny forsikringssag'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sagsnr. *</Label><Input value={form.case_number} onChange={(e) => set('case_number', e.target.value)} /></div>
              <div><Label>Skadetype</Label><Select value={form.damage_type} onValueChange={(v) => set('damage_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{damageTypes.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kunde</Label><Input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></div>
              <div><Label>Projekt</Label><Input value={form.project_name} onChange={(e) => set('project_name', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Forsikringsselskab</Label><Input value={form.insurance_company} onChange={(e) => set('insurance_company', e.target.value)} /></div>
              <div><Label>Policenummer</Label><Input value={form.policy_number} onChange={(e) => set('policy_number', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Skadesdato</Label><Input type="date" value={form.damage_date} onChange={(e) => set('damage_date', e.target.value)} /></div>
              <div><Label>Est. beløb</Label><Input type="number" value={form.estimated_amount} onChange={(e) => set('estimated_amount', e.target.value ? Number(e.target.value) : '')} /></div>
              <div><Label>Godkendt beløb</Label><Input type="number" value={form.approved_amount} onChange={(e) => set('approved_amount', e.target.value ? Number(e.target.value) : '')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sagsbehandler</Label><Input value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value)} /></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Skadesrapport</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              {[['Før-billeder', 'before_photo_urls'], ['Efter-billeder', 'after_photo_urls']].map(([label, field]) => (
                <div key={field}>
                  <Label>{label}</Label>
                  <div className="space-y-1.5">
                    {(form[field] || []).map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} alt="" className="w-full h-20 object-cover rounded-lg" />
                        <button onClick={() => removePhoto(field, idx)} className="absolute top-1 right-1 bg-white/80 rounded p-0.5 text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <label className="flex items-center justify-center gap-1 border border-dashed border-slate-300 rounded-lg py-2 text-xs text-slate-500 cursor-pointer hover:bg-slate-50">
                      <Upload className="w-3 h-3" /> {uploading === field ? 'Uploader...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e, field)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <Label>Skadesrapport (PDF/dokument)</Label>
              {form.report_url ? (
                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                  <a href={form.report_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600"><FileText className="w-4 h-4" /> Vis rapport</a>
                  <button onClick={() => set('report_url', '')} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-1 border border-dashed border-slate-300 rounded-lg py-3 text-sm text-slate-500 cursor-pointer hover:bg-slate-50">
                  <Upload className="w-4 h-4" /> {uploading === 'report' ? 'Uploader...' : 'Upload rapport'}
                  <input type="file" className="hidden" onChange={(e) => upload(e, 'report')} />
                </label>
              )}
            </div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}