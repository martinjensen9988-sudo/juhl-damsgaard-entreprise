import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDKK, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, AlertTriangle, FileCheck, ShieldAlert, Search, Upload, X, Award, Loader2, Download } from 'lucide-react';
import { generateAsbestCertificate } from '@/lib/asbestCertificate';

const statusColors = {
  Planlagt: 'bg-blue-100 text-blue-700 border-blue-200',
  'I gang': 'bg-amber-100 text-amber-700 border-amber-200',
  Gennemført: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Certificeret: 'bg-purple-100 text-purple-700 border-purple-200',
  Afsluttet: 'bg-slate-100 text-slate-600 border-slate-200',
};

const typeColors = {
  'Hvid asbest (Chrysotil)': 'bg-slate-100 text-slate-700',
  'Brun asbest (Amosit)': 'bg-orange-100 text-orange-700',
  'Blå asbest (Crocidolit)': 'bg-red-100 text-red-700',
  Blandet: 'bg-amber-100 text-amber-700',
  Ukendt: 'bg-gray-100 text-gray-600',
};

const emptyForm = {
  title: '',
  project_id: '',
  project_name: '',
  customer_name: '',
  address: '',
  asbestos_type: 'Hvid asbest (Chrysotil)',
  location: '',
  sample_results: '',
  amount: '',
  unit: 'm²',
  removal_method: 'Mekanisk fjernelse',
  status: 'Planlagt',
  start_date: '',
  end_date: '',
  responsible_person: '',
  safety_measures: '',
  disposal_facility: '',
  certificate_number: '',
  certificate_url: '',
  before_photo_url: '',
  after_photo_url: '',
  notes: '',
};

export default function AsbestFjernelse() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, projectData] = await Promise.all([
        base44.entities.AsbestFjernelse.list(),
        base44.entities.Project.list().catch(() => []),
      ]);
      setItems(data || []);
      setProjects(projectData || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = items.filter((item) => {
    const matchSearch = !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.project_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.address?.toLowerCase().includes(search.toLowerCase()) ||
      item.responsible_person?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...emptyForm, ...item });
    setDialogOpen(true);
  };

  const handleField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleProject = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setForm((f) => ({
        ...f,
        project_id: project.id,
        project_name: project.name,
        customer_name: project.customer_name || '',
        address: project.address || f.address,
      }));
    } else {
      setForm((f) => ({ ...f, project_id: '', project_name: '' }));
    }
  };

  const handleFile = async (field, file) => {
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, [field]: file_url }));
    } catch (e) {
      console.error(e);
      alert('Fil kunne ikke uploades');
    }
  };

  const generateCertNumber = () => {
    const year = new Date().getFullYear();
    const existingCount = items.filter((i) => i.certificate_number?.includes(`ASB-${year}`)).length;
    return `ASB-${year}-${String(existingCount + 1).padStart(4, '0')}`;
  };

  const save = async () => {
    if (!form.title) { alert('Angiv en titel'); return; }
    setSaving(true);
    try {
      let payload = { ...form, amount: Number(form.amount) || 0 };

      // Auto-generate certificate when status is set to "Certificeret"
      const isBecomingCertified = form.status === 'Certificeret' && (!editing || editing.status !== 'Certificeret');
      if (isBecomingCertified && !payload.certificate_number) {
        const certNumber = generateCertNumber();
        payload.certificate_number = certNumber;

        // Generate PDF certificate
        const doc = generateAsbestCertificate(payload);
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], `asbest-certifikat-${certNumber}.pdf`, { type: 'application/pdf' });

        // Upload the certificate
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        payload.certificate_url = file_url;
      }

      if (editing) {
        await base44.entities.AsbestFjernelse.update(editing.id, payload);
      } else {
        await base44.entities.AsbestFjernelse.create(payload);
      }
      setDialogOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert('Der opstod en fejl ved lagring');
    }
    setSaving(false);
  };

  const remove = async (item) => {
    if (!confirm(`Slet "${item.title}"?`)) return;
    try {
      await base44.entities.AsbestFjernelse.delete(item.id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const stats = {
    total: items.length,
    active: items.filter((i) => i.status === 'I gang' || i.status === 'Planlagt').length,
    completed: items.filter((i) => i.status === 'Gennemført' || i.status === 'Certificeret' || i.status === 'Afsluttet').length,
    certified: items.filter((i) => i.status === 'Certificeret' || i.status === 'Afsluttet').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Asbestfjernelse</h1>
              <p className="text-slate-500 mt-0.5">Dokumentation og styring af asbestfjernelse</p>
            </div>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Ny dokumentation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Total</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Aktive</div>
          <div className="text-2xl font-bold text-amber-600">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Gennemført</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Certificeret</div>
          <div className="text-2xl font-bold text-purple-600">{stats.certified}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Søg på titel, projekt, adresse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statusser</SelectItem>
            <SelectItem value="Planlagt">Planlagt</SelectItem>
            <SelectItem value="I gang">I gang</SelectItem>
            <SelectItem value="Gennemført">Gennemført</SelectItem>
            <SelectItem value="Certificeret">Certificeret</SelectItem>
            <SelectItem value="Afsluttet">Afsluttet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Indlæser...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen dokumentation fundet</p>
          <Button onClick={openCreate} variant="outline" className="mt-4">
            <Plus className="w-4 h-4" /> Opret første dokumentation
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition group">
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
                    {item.project_name && <p className="text-sm text-slate-500 truncate mt-0.5">{item.project_name}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[item.status] || statusColors.Planlagt}`}>
                    {item.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeColors[item.asbestos_type] || typeColors.Ukendt}`}>
                      {item.asbestos_type}
                    </span>
                  </div>
                  {item.address && (
                    <div className="text-slate-500 flex items-start gap-1.5">
                      <span className="text-slate-400 mt-0.5">📍</span> <span className="truncate">{item.address}</span>
                    </div>
                  )}
                  {item.location && (
                    <div className="text-slate-500 flex items-start gap-1.5">
                      <span className="text-slate-400 mt-0.5">🏗️</span> <span className="truncate">{item.location}</span>
                    </div>
                  )}
                  {item.responsible_person && (
                    <div className="text-slate-500 flex items-start gap-1.5">
                      <span className="text-slate-400 mt-0.5">👤</span> <span className="truncate">{item.responsible_person}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    {item.amount > 0 && <span>{item.amount} {item.unit}</span>}
                    {item.start_date && <span>{formatDate(item.start_date)}</span>}
                    {item.certificate_number && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <FileCheck className="w-3.5 h-3.5" /> {item.certificate_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {item.certificate_url && (
                <div className="px-5 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Award className="w-4 h-4" /> Certifikat genereret
                  </span>
                  <a href={item.certificate_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium">
                    <Download className="w-3.5 h-3.5" /> Åbn certifikat
                  </a>
                </div>
              )}

              <div className="flex border-t border-slate-100">
                <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition">
                  <Pencil className="w-3.5 h-3.5" /> Rediger
                </button>
                <button onClick={() => remove(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition border-l border-slate-100">
                  <Trash2 className="w-3.5 h-3.5" /> Slet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              {editing ? 'Rediger dokumentation' : 'Ny asbestfjernelse'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Warning banner */}
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Asbest er farligt affald og skal håndteres efter gældende regler. Dokumentér alt fjernelse korrekt.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Titel *</Label>
                <Input value={form.title} onChange={(e) => handleField('title', e.target.value)} placeholder="f.eks. Asbestfjernelse tagetager" />
              </div>

              <div>
                <Label>Projekt</Label>
                <Select value={form.project_id} onValueChange={handleProject}>
                  <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Kunde</Label>
                <Input value={form.customer_name} onChange={(e) => handleField('customer_name', e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>Adresse</Label>
                <Input value={form.address} onChange={(e) => handleField('address', e.target.value)} placeholder="Hvor er asbesten lokaliseret?" />
              </div>

              <div className="md:col-span-2">
                <Label>Placering i bygning</Label>
                <Input value={form.location} onChange={(e) => handleField('location', e.target.value)} placeholder="f.eks. Tag, kælderloft, eternitplader" />
              </div>

              <div className="md:col-span-2">
                <Label>Prøveresultater</Label>
                <Textarea value={form.sample_results} onChange={(e) => handleField('sample_results', e.target.value)} placeholder="Resultater af asbestanalyse, laboratorieprøver, fundne fibre mv." rows={2} />
              </div>

              <div>
                <Label>Asbesttype *</Label>
                <Select value={form.asbestos_type} onValueChange={(v) => handleField('asbestos_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hvid asbest (Chrysotil)">Hvid asbest (Chrysotil)</SelectItem>
                    <SelectItem value="Brun asbest (Amosit)">Brun asbest (Amosit)</SelectItem>
                    <SelectItem value="Blå asbest (Crocidolit)">Blå asbest (Crocidolit)</SelectItem>
                    <SelectItem value="Blandet">Blandet</SelectItem>
                    <SelectItem value="Ukendt">Ukendt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mængde</Label>
                  <Input type="number" value={form.amount} onChange={(e) => handleField('amount', e.target.value)} />
                </div>
                <div>
                  <Label>Enhed</Label>
                  <Select value={form.unit} onValueChange={(v) => handleField('unit', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['m²', 'm³', 'kg', 'ton', 'stk', 'm'].map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Fjernelsesmetode</Label>
                <Select value={form.removal_method} onValueChange={(v) => handleField('removal_method', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mekanisk fjernelse">Mekanisk fjernelse</SelectItem>
                    <SelectItem value="Kemisk fjernelse">Kemisk fjernelse</SelectItem>
                    <SelectItem value="Indkapsling">Indkapsling</SelectItem>
                    <SelectItem value="Bortskaffelse af hele elementer">Bortskaffelse af hele elementer</SelectItem>
                    <SelectItem value="Andet">Andet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={(v) => handleField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planlagt">Planlagt</SelectItem>
                    <SelectItem value="I gang">I gang</SelectItem>
                    <SelectItem value="Gennemført">Gennemført</SelectItem>
                    <SelectItem value="Certificeret">Certificeret</SelectItem>
                    <SelectItem value="Afsluttet">Afsluttet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Startdato</Label>
                <Input type="date" value={form.start_date} onChange={(e) => handleField('start_date', e.target.value)} />
              </div>

              <div>
                <Label>Slutdato</Label>
                <Input type="date" value={form.end_date} onChange={(e) => handleField('end_date', e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>Ansvarlig</Label>
                <Input value={form.responsible_person} onChange={(e) => handleField('responsible_person', e.target.value)} placeholder="Fagansvarlig for fjernelsen" />
              </div>

              <div className="md:col-span-2">
                <Label>Sikkerhedsforanstaltninger</Label>
                <Textarea value={form.safety_measures} onChange={(e) => handleField('safety_measures', e.target.value)} placeholder="Beskriv beskyttelsesforanstaltninger, afskærmning, personlige værnemidler mv." rows={3} />
              </div>

              <div className="md:col-span-2">
                <Label>Modtageranlæg</Label>
                <Input value={form.disposal_facility} onChange={(e) => handleField('disposal_facility', e.target.value)} placeholder="Hvor er asbesten deponeret?" />
              </div>

              <div>
                <Label>Certifikatnr.</Label>
                <Input value={form.certificate_number} onChange={(e) => handleField('certificate_number', e.target.value)} placeholder="Affaldsregistreringsnr." />
              </div>

              <div>
                <Label>Certifikat fil</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={(e) => e.target.files[0] && handleFile('certificate_url', e.target.files[0])}
                    className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-700 file:font-medium"
                  />
                  {form.certificate_url && <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => handleField('certificate_url', '')} />}
                </div>
                {form.certificate_url && <a href={form.certificate_url} target="_blank" rel="noreferrer" className="text-xs text-amber-600 hover:underline mt-1 block">Se fil</a>}
              </div>

              <div>
                <Label>Før-billede</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFile('before_photo_url', e.target.files[0])}
                    className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-700 file:font-medium"
                  />
                  {form.before_photo_url && <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => handleField('before_photo_url', '')} />}
                </div>
              </div>

              <div>
                <Label>Efter-billede</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFile('after_photo_url', e.target.files[0])}
                    className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-700 file:font-medium"
                  />
                  {form.after_photo_url && <X className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => handleField('after_photo_url', '')} />}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Noter</Label>
                <Textarea value={form.notes} onChange={(e) => handleField('notes', e.target.value)} rows={2} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Gemmer...' : (editing ? 'Gem ændringer' : 'Opret dokumentation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}