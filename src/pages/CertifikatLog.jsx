import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search, Award, AlertTriangle, CheckCircle2, Calendar, Upload, X } from 'lucide-react';

const typeColors = { Gravemaskineførerbevis: 'bg-amber-100 text-amber-700', Håndværksuddannelse: 'bg-blue-100 text-blue-700', Førstehjælp: 'bg-red-100 text-red-700', Arbejdsmiljø: 'bg-emerald-100 text-emerald-700', Brandtilsyn: 'bg-orange-100 text-orange-700', Elektriker: 'bg-purple-100 text-purple-700', Svejsebevis: 'bg-slate-100 text-slate-700', Andet: 'bg-gray-100 text-gray-600' };
const empty = { employee_name: '', certificate_type: 'Andet', certificate_number: '', issue_date: '', expiry_date: '', issuer: '', file_url: '', status: 'Gyldig', notes: '' };

export default function CertifikatLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { setItems(await base44.entities.CertificateLog.list() || []); } catch(e){console.error(e);} setLoading(false); };
  useEffect(() => { load(); }, []);

  const today = new Date(); const in30 = new Date(); in30.setDate(in30.getDate()+30); const in90 = new Date(); in90.setDate(in90.getDate()+90);
  const getStatus = (item) => {
    if (!item.expiry_date) return item.status;
    const exp = new Date(item.expiry_date);
    if (exp < today) return 'Udløbet';
    if (exp < in30) return 'Udløber snart';
    if (exp < in90) return 'Udløber snart';
    return 'Gyldig';
  };

  const filtered = items.filter(i => (!search || i.employee_name?.toLowerCase().includes(search.toLowerCase()) || i.certificate_type?.toLowerCase().includes(search.toLowerCase())) && (statusFilter === 'all' || getStatus(i) === statusFilter));

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({...empty, ...i}); setDialogOpen(true); };
  const field = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleFile = async (file) => { if(!file) return; try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm(f=>({...f,file_url})); } catch(e){ alert('Upload fejlede'); } };

  const save = async () => {
    if (!form.employee_name || !form.certificate_type || !form.expiry_date) { alert('Udfyld medarbejder, type og udløbsdato'); return; }
    setSaving(true);
    try { const payload = {...form, status: getStatus(form)}; if (editing) await base44.entities.CertificateLog.update(editing.id, payload); else await base44.entities.CertificateLog.create(payload); setDialogOpen(false); load(); }
    catch(e){ alert('Fejl'); } setSaving(false);
  };

  const remove = async (i) => { if (confirm(`Slet certifikat for ${i.employee_name}?`)) { try { await base44.entities.CertificateLog.delete(i.id); load(); } catch(e){} } };

  const stats = { total: items.length, valid: items.filter(i=>getStatus(i)==='Gyldig').length, expiring: items.filter(i=>getStatus(i)==='Udløber snart').length, expired: items.filter(i=>getStatus(i)==='Udløbet').length };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Award className="w-5 h-5 text-amber-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Certifikat Log</h1><p className="text-slate-500 mt-0.5">Medarbejdercertifikater med udløbsadvarsler</p></div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj certifikat</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Total</div><div className="text-2xl font-bold text-slate-900">{stats.total}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Gyldige</div><div className="text-2xl font-bold text-emerald-600">{stats.valid}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Udløber snart</div><div className="text-2xl font-bold text-amber-600 flex items-center gap-1">{stats.expiring}{stats.expiring>0 && <AlertTriangle className="w-4 h-4" />}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Udløbet</div><div className="text-2xl font-bold text-red-600 flex items-center gap-1">{stats.expired}{stats.expired>0 && <AlertTriangle className="w-4 h-4" />}</div></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Søg på medarbejder..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle statusser</SelectItem><SelectItem value="Gyldig">Gyldige</SelectItem><SelectItem value="Udløber snart">Udløber snart</SelectItem><SelectItem value="Udløbet">Udløbet</SelectItem></SelectContent></Select>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Award className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen certifikater fundet</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map(i => {
              const status = getStatus(i); const exp = i.expiry_date ? new Date(i.expiry_date) : null;
              const isExpired = status === 'Udløbet'; const isExpiring = status === 'Udløber snart';
              return (
                <div key={i.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0"><Award className="w-5 h-5 text-slate-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold text-slate-900">{i.employee_name}</h3><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[i.certificate_type]||typeColors.Andet}`}>{i.certificate_type}</span></div>
                    {i.certificate_number && <div className="text-sm text-slate-500">Cert.nr. {i.certificate_number}{i.issuer && ` · ${i.issuer}`}</div>}
                  </div>
                  <div className="hidden md:block text-right">
                    <div className={`text-sm flex items-center gap-1 justify-end ${isExpired?'text-red-600 font-bold':isExpiring?'text-amber-600 font-medium':'text-slate-600'}`}>{exp && <><Calendar className="w-3.5 h-3.5" />{formatDate(i.expiry_date)}</>}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isExpired?'bg-red-100 text-red-700':isExpiring?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>{isExpired?'Udløbet':isExpiring?'Udløber snart':'Gyldig'}</span>
                  <div className="flex gap-1"><button onClick={()=>openEdit(i)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button><button onClick={()=>remove(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-amber-600" />{editing ? 'Rediger certifikat' : 'Nyt certifikat'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Medarbejder *</Label><Input value={form.employee_name} onChange={e=>field('employee_name',e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Certifikattype *</Label><Select value={form.certificate_type} onValueChange={v=>field('certificate_type',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(typeColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Certifikatnr.</Label><Input value={form.certificate_number} onChange={e=>field('certificate_number',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Udstedt</Label><Input type="date" value={form.issue_date} onChange={e=>field('issue_date',e.target.value)} /></div>
              <div><Label>Udløber *</Label><Input type="date" value={form.expiry_date} onChange={e=>field('expiry_date',e.target.value)} /></div>
            </div>
            <div><Label>Udsteder</Label><Input value={form.issuer} onChange={e=>field('issuer',e.target.value)} /></div>
            <div><Label>Certifikat fil</Label>
              <div className="flex items-center gap-2"><Input type="file" onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])} className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-700 file:font-medium" />{form.file_url && <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={()=>field('file_url','')} />}</div>
              {form.file_url && <a href={form.file_url} target="_blank" rel="noreferrer" className="text-xs text-amber-600 hover:underline mt-1 block">Se fil</a>}
            </div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={e=>field('notes',e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving?'Gemmer...':'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}