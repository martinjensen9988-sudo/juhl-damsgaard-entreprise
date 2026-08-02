import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload, ClipboardList, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/format';

const statuses = ['Planlagt', 'Gennemført', 'Med mangler', 'Afvist'];
const statusColor = { Planlagt: 'bg-slate-100 text-slate-600', Gennemført: 'bg-emerald-100 text-emerald-700', 'Med mangler': 'bg-amber-100 text-amber-700', Afvist: 'bg-red-100 text-red-700' };
const empty = { title: '', project_id: '', project_name: '', customer_name: '', handover_date: '', status: 'Planlagt', defects: [], before_photo_urls: [], after_photo_urls: [], signature_url: '', signed_by: '', signed_date: '', inspector: '', notes: '' };

export default function Afleveringsforretning() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');

  const load = async () => {
    setLoading(true);
    try { const [h, p] = await Promise.all([base44.entities.Handover.list(), base44.entities.Project.list().catch(() => [])]); setItems(h || []); setProjects(p || []); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const setProject = (id) => { const p = projects.find((x) => x.id === id); setForm((s) => ({ ...s, project_id: id, project_name: p?.name || '' })); };
  const addDefect = () => setForm((s) => ({ ...s, defects: [...s.defects, { description: '', resolved: false }] }));
  const updateDefect = (i, patch) => setForm((s) => ({ ...s, defects: s.defects.map((d, idx) => idx === i ? { ...d, ...patch } : d) }));
  const removeDefect = (i) => setForm((s) => ({ ...s, defects: s.defects.filter((_, idx) => idx !== i) }));

  const upload = async (e, field) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(field);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm((s) => ({ ...s, [field]: [...(s[field] || []), file_url] })); }
    catch (err) { console.error(err); alert('Upload fejlede'); }
    setUploading('');
  };
  const uploadSignature = async (e) => { const file = e.target.files?.[0]; if (!file) return; setUploading('sig'); try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); set('signature_url', file_url); } catch (err) { alert('Upload fejlede'); } setUploading(''); };
  const removePhoto = (field, idx) => setForm((s) => ({ ...s, [field]: s[field].filter((_, i) => i !== idx) }));

  const openCreate = () => { setEditing(null); setForm({ ...empty, handover_date: new Date().toISOString().split('T')[0] }); setOpen(true); };
  const openEdit = (h) => { setEditing(h); setForm({ ...empty, ...h, defects: h.defects || [] }); setOpen(true); };

  const save = async () => {
    if (!form.project_name) return alert('Angiv projekt');
    setSaving(true);
    try { editing ? await base44.entities.Handover.update(editing.id, form) : await base44.entities.Handover.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (h) => { if (!confirm('Slet aflevering?')) return; try { await base44.entities.Handover.delete(h.id); load(); } catch (e) {} };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Afleveringsforretning</h1>
            <p className="text-slate-500 mt-0.5">Registrer mangler, billedddokumentation og kundesignatur ved projektafslutning</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Ny aflevering</Button>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen afleveringer endnu</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((h) => {
            const openDefects = (h.defects || []).filter((d) => !d.resolved).length;
            return (
              <div key={h.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{h.project_name}</div>{h.customer_name && <div className="text-xs text-slate-500 truncate">{h.customer_name}</div>}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[h.status] || 'bg-slate-100'}`}>{h.status}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Aflevering: {formatDate(h.handover_date)}</div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  <span className="text-slate-500">Mangler: {h.defects?.length || 0}{openDefects > 0 && <span className="text-amber-600 font-medium"> ({openDefects} åben)</span>}</span>
                  <span className="text-slate-500">Før: {h.before_photo_urls?.length || 0}</span>
                  <span className="text-slate-500">Efter: {h.after_photo_urls?.length || 0}</span>
                  {h.signature_url && <span className="text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Signeret</span>}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(h)} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Pencil className="w-3 h-3" /> Rediger</button>
                  <button onClick={() => remove(h)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /> Slet</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger aflevering' : 'Ny aflevering'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Projekt *</Label><Select value={form.project_id} onValueChange={setProject}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Kunde</Label><Input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Afleveringsdato</Label><Input type="date" value={form.handover_date} onChange={(e) => set('handover_date', e.target.value)} /></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Afleveret af</Label><Input value={form.inspector} onChange={(e) => set('inspector', e.target.value)} /></div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Mangler</Label><Button variant="outline" size="sm" onClick={addDefect}><Plus className="w-3 h-3" /> Tilføj</Button></div>
              <div className="space-y-2">
                {(form.defects || []).map((d, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                    <Input className="flex-1 h-8" placeholder="Beskriv mangel" value={d.description} onChange={(e) => updateDefect(i, { description: e.target.value })} />
                    <button onClick={() => updateDefect(i, { resolved: !d.resolved })} className={`px-2 py-1 rounded text-xs ${d.resolved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{d.resolved ? 'Løst' : 'Åben'}</button>
                    <button onClick={() => removeDefect(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {(form.defects || []).length === 0 && <p className="text-sm text-slate-400 text-center py-2">Ingen mangler registreret</p>}
              </div>
            </div>
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
              <Label>Kundesignatur</Label>
              {form.signature_url ? (
                <div className="relative">
                  <img src={form.signature_url} alt="signatur" className="max-h-24 rounded-lg border border-slate-200" />
                  <button onClick={() => set('signature_url', '')} className="absolute top-1 right-1 bg-white/80 rounded p-1 text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-1 border border-dashed border-slate-300 rounded-lg py-3 text-sm text-slate-500 cursor-pointer hover:bg-slate-50">
                  <Upload className="w-4 h-4" /> {uploading === 'sig' ? 'Uploader...' : 'Upload signatur'}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadSignature} />
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Signeret af</Label><Input value={form.signed_by} onChange={(e) => set('signed_by', e.target.value)} /></div>
              <div><Label>Signeret dato</Label><Input type="date" value={form.signed_date} onChange={(e) => set('signed_date', e.target.value)} /></div>
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