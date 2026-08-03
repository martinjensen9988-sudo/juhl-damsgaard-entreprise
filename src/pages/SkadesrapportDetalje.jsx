import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image as ImageComponent } from '@/components/ui/image';
import {
  ArrowLeft, Save, FileDown, Plus, Trash2, Upload, ShieldAlert,
  Camera, Wrench, MessageSquare, ClipboardList, Phone, Mail,
} from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';
import { generateDamageReportPDF } from '@/lib/damageReportPdf';
import { useToast } from '@/components/ui/use-toast';

const damageTypes = ['Vandskade', 'Stormskade', 'Frostskade', 'Ildskade', 'Hærværk', 'Andet'];
const statuses = ['Oprettet', 'Anmeldt', 'Under behandling', 'Godkendt', 'Afvist', 'Udbedres', 'Afsluttet'];
const repairStatuses = ['Ikke påbegyndt', 'Planlagt', 'I gang', 'Afsluttet'];
const itemRepairStatuses = ['Ikke påbegyndt', 'I gang', 'Afsluttet'];
const severities = ['Lille', 'Mellem', 'Stor', 'Kritisk'];
const commTypes = ['Email', 'Telefon', 'Møde', 'Brev', 'Besigtigelse', 'Andet'];

const statusColor = {
  Oprettet: 'bg-slate-100 text-slate-600',
  Anmeldt: 'bg-amber-100 text-amber-700',
  'Under behandling': 'bg-blue-100 text-blue-700',
  Godkendt: 'bg-emerald-100 text-emerald-700',
  Afvist: 'bg-red-100 text-red-700',
  Udbedres: 'bg-purple-100 text-purple-700',
  Afsluttet: 'bg-slate-200 text-slate-600',
};

const photoFields = [
  { key: 'before_photo_urls', label: 'Før-skade', icon: Camera },
  { key: 'during_photo_urls', label: 'Undervejs', icon: Camera },
  { key: 'after_photo_urls', label: 'Efter udbedring', icon: Camera },
];

export default function SkadesrapportDetalje() {
  const id = new URLSearchParams(window.location.search).get('id');
  const { toast } = useToast();
  const [incident, setIncident] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, settings] = await Promise.all([
        base44.entities.InsuranceCase.get(id),
        base44.entities.CompanySettings.list().then((r) => r?.[0] || null),
      ]);
      setIncident(c);
      setCompany(settings);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };
  useEffect(() => { if (id) load(); }, [id]);

  const set = (f, v) => setIncident((s) => ({ ...s, [f]: v }));

  const upload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set(field, [...(incident[field] || []), file_url]);
    } catch (err) {
      toast({ title: 'Upload fejlede', variant: 'destructive' });
    }
    setUploading('');
    e.target.value = '';
  };

  const removePhoto = (field, idx) =>
    set(field, (incident[field] || []).filter((_, i) => i !== idx));

  // Damage items
  const addItem = () =>
    set('damage_items', [
      ...(incident.damage_items || []),
      { description: '', location: '', severity: 'Mellem', estimated_cost: 0, approved_cost: 0, repair_status: 'Ikke påbegyndt' },
    ]);
  const updateItem = (idx, f, v) =>
    set('damage_items', (incident.damage_items || []).map((it, i) => (i === idx ? { ...it, [f]: v } : it)));
  const removeItem = (idx) =>
    set('damage_items', (incident.damage_items || []).filter((_, i) => i !== idx));

  // Communication log
  const addEntry = () =>
    set('communication_log', [
      ...(incident.communication_log || []),
      { date: new Date().toISOString().split('T')[0], type: 'Email', author: '', message: '' },
    ]);
  const updateEntry = (idx, f, v) =>
    set('communication_log', (incident.communication_log || []).map((e, i) => (i === idx ? { ...e, [f]: v } : e)));
  const removeEntry = (idx) =>
    set('communication_log', (incident.communication_log || []).filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.InsuranceCase.update(id, {
        case_number: incident.case_number,
        customer_name: incident.customer_name,
        project_name: incident.project_name,
        insurance_company: incident.insurance_company,
        insurance_contact: incident.insurance_contact,
        insurance_phone: incident.insurance_phone,
        insurance_email: incident.insurance_email,
        policy_number: incident.policy_number,
        damage_type: incident.damage_type,
        damage_date: incident.damage_date,
        reported_date: incident.reported_date,
        address: incident.address,
        description: incident.description,
        damage_items: incident.damage_items,
        before_photo_urls: incident.before_photo_urls,
        during_photo_urls: incident.during_photo_urls,
        after_photo_urls: incident.after_photo_urls,
        report_url: incident.report_url,
        communication_log: incident.communication_log,
        status: incident.status,
        estimated_amount: incident.estimated_amount,
        approved_amount: incident.approved_amount,
        deductible: incident.deductible,
        repair_status: incident.repair_status,
        repair_start_date: incident.repair_start_date,
        repair_end_date: incident.repair_end_date,
        repair_assigned_to: incident.repair_assigned_to,
        repair_notes: incident.repair_notes,
        assigned_to: incident.assigned_to,
        notes: incident.notes,
      });
      toast({ title: 'Sag gemt', description: incident.case_number });
      load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Kunne ikke gemme', variant: 'destructive' });
    }
    setSaving(false);
  };

  const downloadPDF = async () => {
    setGenerating(true);
    try {
      await generateDamageReportPDF(incident, company || {});
      toast({ title: 'Skadesrapport genereret' });
    } catch (e) {
      console.error(e);
      toast({ title: 'PDF kunne ikke genereres', variant: 'destructive' });
    }
    setGenerating(false);
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Indlæser sag…</div>;
  if (!incident) return <div className="text-center py-20 text-slate-400">Sag ikke fundet</div>;

  const totalEstimate = (incident.damage_items || []).reduce((s, i) => s + (Number(i.estimated_cost) || 0), 0);
  const totalApproved = (incident.damage_items || []).reduce((s, i) => s + (Number(i.approved_cost) || 0), 0);
  const photoCount =
    (incident.before_photo_urls?.length || 0) +
    (incident.during_photo_urls?.length || 0) +
    (incident.after_photo_urls?.length || 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-11 h-11 rounded-lg bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{incident.case_number}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[incident.status] || 'bg-slate-100'}`}>
                {incident.status}
              </span>
              <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{incident.damage_type}</span>
              <span className="text-xs text-slate-400">{formatDate(incident.damage_date)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadPDF} disabled={generating}>
            <FileDown className="w-4 h-4" /> {generating ? 'Genererer…' : 'Skadesrapport PDF'}
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Gemmer…' : 'Gem sag'}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Skadesposteringer</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{(incident.damage_items || []).length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Estimeret i alt</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatDKK(incident.estimated_amount || totalEstimate)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Godkendt</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{formatDKK(incident.approved_amount || totalApproved)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Billeder</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{photoCount}</div>
        </div>
      </div>

      {/* Case info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Sagsoplysninger</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><Label>Sagsnr.</Label><Input value={incident.case_number || ''} onChange={(e) => set('case_number', e.target.value)} /></div>
          <div><Label>Kunde</Label><Input value={incident.customer_name || ''} onChange={(e) => set('customer_name', e.target.value)} /></div>
          <div><Label>Projekt</Label><Input value={incident.project_name || ''} onChange={(e) => set('project_name', e.target.value)} /></div>
          <div><Label>Skadetype</Label><Select value={incident.damage_type} onValueChange={(v) => set('damage_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{damageTypes.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Skadesdato</Label><Input type="date" value={incident.damage_date || ''} onChange={(e) => set('damage_date', e.target.value)} /></div>
          <div><Label>Anmeldt den</Label><Input type="date" value={incident.reported_date || ''} onChange={(e) => set('reported_date', e.target.value)} /></div>
          <div><Label>Skadesadresse</Label><Input value={incident.address || ''} onChange={(e) => set('address', e.target.value)} /></div>
          <div><Label>Sagsbehandler</Label><Input value={incident.assigned_to || ''} onChange={(e) => set('assigned_to', e.target.value)} /></div>
          <div><Label>Status</Label><Select value={incident.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        </div>
      </div>

      {/* Insurance company contact */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Forsikringsselskab</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><Label>Selskab</Label><Input value={incident.insurance_company || ''} onChange={(e) => set('insurance_company', e.target.value)} /></div>
          <div><Label>Policenummer</Label><Input value={incident.policy_number || ''} onChange={(e) => set('policy_number', e.target.value)} /></div>
          <div><Label>Sagsbehandler hos forsikring</Label><Input value={incident.insurance_contact || ''} onChange={(e) => set('insurance_contact', e.target.value)} /></div>
          <div><Label>Telefon</Label><Input value={incident.insurance_phone || ''} onChange={(e) => set('insurance_phone', e.target.value)} /></div>
          <div><Label>Email</Label><Input value={incident.insurance_email || ''} onChange={(e) => set('insurance_email', e.target.value)} /></div>
          <div><Label>Selvrisiko (DKK)</Label><Input type="number" value={incident.deductible || ''} onChange={(e) => set('deductible', e.target.value ? Number(e.target.value) : 0)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Estimeret beløb (DKK)</Label><Input type="number" value={incident.estimated_amount || ''} onChange={(e) => set('estimated_amount', e.target.value ? Number(e.target.value) : 0)} /></div>
          <div><Label>Godkendt beløb (DKK)</Label><Input type="number" value={incident.approved_amount || ''} onChange={(e) => set('approved_amount', e.target.value ? Number(e.target.value) : 0)} /></div>
        </div>
      </div>

      {/* Damage description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><FileDown className="w-4 h-4" /> Skadesbeskrivelse</h2>
        <Textarea value={incident.description || ''} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Detaljeret beskrivelse af skaden, årsag, omfang…" />
      </div>

      {/* Damage items */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Skadesposteringer</h2>
          <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-4 h-4" /> Tilføj post</Button>
        </div>
        {(incident.damage_items || []).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Ingen skadesposteringer — tilføj en for at detaljere skaden og estimere prisen</p>
        ) : (
          <div className="space-y-3">
            {(incident.damage_items || []).map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                <div className="md:col-span-4">
                  <Label className="text-xs">Beskrivelse</Label>
                  <Input value={item.description || ''} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="F.eks. vådt gipsvæg" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Lokation</Label>
                  <Input value={item.location || ''} onChange={(e) => updateItem(idx, 'location', e.target.value)} placeholder="F.eks. stue" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Omfang</Label>
                  <Select value={item.severity} onValueChange={(v) => updateItem(idx, 'severity', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{severities.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Est. pris</Label>
                  <Input type="number" value={item.estimated_cost || ''} onChange={(e) => updateItem(idx, 'estimated_cost', e.target.value ? Number(e.target.value) : 0)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Godkendt pris</Label>
                  <Input type="number" value={item.approved_cost || ''} onChange={(e) => updateItem(idx, 'approved_cost', e.target.value ? Number(e.target.value) : 0)} />
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs">Udbedringsstatus</Label>
                  <Select value={item.repair_status} onValueChange={(v) => updateItem(idx, 'repair_status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{itemRepairStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="md:col-span-9 flex items-end justify-end">
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4" /> Slet post</Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-6 text-sm pt-2 border-t border-slate-100">
              <span className="text-slate-500">Estimeret i alt: <strong className="text-slate-900">{formatDKK(totalEstimate)}</strong></span>
              <span className="text-slate-500">Godkendt i alt: <strong className="text-emerald-600">{formatDKK(totalApproved)}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Photo documentation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Camera className="w-4 h-4" /> Bilddokumentation</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {photoFields.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-sm font-medium mb-2 block">{label} ({(incident[key] || []).length})</Label>
              <div className="space-y-2">
                {(incident[key] || []).map((url, idx) => (
                  <div key={idx} className="relative group">
                    <ImageComponent src={url} alt={`${label} ${idx + 1}`} className="w-full h-28 rounded-lg" fittingType="fill" />
                    <button
                      onClick={() => removePhoto(key, idx)}
                      className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <label className={`flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-lg py-3 text-xs text-slate-500 cursor-pointer hover:bg-slate-50 ${uploading === key ? 'opacity-50' : ''}`}>
                  <Upload className="w-3.5 h-3.5" /> {uploading === key ? 'Uploader…' : 'Upload billede'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e, key)} disabled={uploading === key} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Repair tracking */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Wrench className="w-4 h-4" /> Udbedring</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label>Udbedringsstatus</Label><Select value={incident.repair_status || 'Ikke påbegyndt'} onValueChange={(v) => set('repair_status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{repairStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Udbedres af</Label><Input value={incident.repair_assigned_to || ''} onChange={(e) => set('repair_assigned_to', e.target.value)} /></div>
          <div><Label>Startdato</Label><Input type="date" value={incident.repair_start_date || ''} onChange={(e) => set('repair_start_date', e.target.value)} /></div>
          <div><Label>Slutdato</Label><Input type="date" value={incident.repair_end_date || ''} onChange={(e) => set('repair_end_date', e.target.value)} /></div>
        </div>
        <div><Label>Udbedringsnoter</Label><Textarea value={incident.repair_notes || ''} onChange={(e) => set('repair_notes', e.target.value)} rows={3} placeholder="Beskriv udbedringsarbejdet, materialer, evt. udfordringer…" /></div>
      </div>

      {/* Communication log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Kommunikationslog med forsikring</h2>
          <Button size="sm" variant="outline" onClick={addEntry}><Plus className="w-4 h-4" /> Tilføj notat</Button>
        </div>
        {(incident.communication_log || []).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Ingen kommunikation registreret endnu</p>
        ) : (
          <div className="space-y-3">
            {(incident.communication_log || []).map((entry, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                <div className="md:col-span-2">
                  <Label className="text-xs">Dato</Label>
                  <Input type="date" value={entry.date || ''} onChange={(e) => updateEntry(idx, 'date', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Type</Label>
                  <Select value={entry.type} onValueChange={(v) => updateEntry(idx, 'type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{commTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs">Afsender</Label>
                  <Input value={entry.author || ''} onChange={(e) => updateEntry(idx, 'author', e.target.value)} placeholder="Hvem?" />
                </div>
                <div className="md:col-span-4">
                  <Label className="text-xs">Besked</Label>
                  <Input value={entry.message || ''} onChange={(e) => updateEntry(idx, 'message', e.target.value)} />
                </div>
                <div className="md:col-span-1 flex items-end justify-end">
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeEntry(idx)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General notes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-900">Interne noter</h2>
        <Textarea value={incident.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 flex justify-end gap-2 bg-white/90 backdrop-blur rounded-xl border border-slate-200 p-3 shadow-lg">
        <Button variant="outline" onClick={downloadPDF} disabled={generating}>
          <FileDown className="w-4 h-4" /> {generating ? 'Genererer…' : 'PDF'}
        </Button>
        <Button onClick={save} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Gemmer…' : 'Gem alle ændringer'}
        </Button>
      </div>
    </div>
  );
}