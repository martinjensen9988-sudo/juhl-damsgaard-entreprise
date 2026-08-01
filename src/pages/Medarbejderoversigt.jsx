import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserCog, Plus, Pencil, Trash2, Loader2, Mail, Phone, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/format';

const TRADES = ['Gravemaskinefører', 'Anlægsgartner', 'Kloakmester', 'Betonarbejder', 'Lastbilchauffør', 'Håndværker', 'Lærling', 'Andet'];
const STATUSES = ['Aktiv', 'Orlov', 'Inaktiv'];
const CERT_TYPES = ['Maskinførerbevis', 'Førstehjælp', 'Arbejdsmiljø', 'Svejsebevis', 'Kranbevis', 'Truckbevis', 'Håndværk', 'Andet'];

const STATUS_BADGE = { Aktiv: 'bg-emerald-100 text-emerald-700', Orlov: 'bg-amber-100 text-amber-700', Inaktiv: 'bg-slate-100 text-slate-500' };
const TRADE_BADGE = { Gravemaskinefører: 'bg-amber-100 text-amber-700', Anlægsgartner: 'bg-emerald-100 text-emerald-700', Kloakmester: 'bg-blue-100 text-blue-700', Betonarbejder: 'bg-slate-100 text-slate-600', Lastbilchauffør: 'bg-indigo-100 text-indigo-700', Håndværker: 'bg-purple-100 text-purple-700', Lærling: 'bg-cyan-100 text-cyan-700', Andet: 'bg-slate-100 text-slate-500' };

const EMPTY_EMP = { name: '', email: '', phone: '', trade: 'Håndværker', hourly_rate: 0, status: 'Aktiv', notes: '' };
const EMPTY_CERT = { employee_id: '', employee_name: '', title: '', type: 'Andet', issue_date: '', expiry_date: '', notes: '' };

export default function Medarbejderoversigt() {
  const [employees, setEmployees] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empDialog, setEmpDialog] = useState(false);
  const [certDialog, setCertDialog] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [editingCert, setEditingCert] = useState(null);
  const [savingEmp, setSavingEmp] = useState(false);
  const [savingCert, setSavingCert] = useState(false);
  const [empForm, setEmpForm] = useState(EMPTY_EMP);
  const [certForm, setCertForm] = useState(EMPTY_CERT);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      const [e, c] = await Promise.all([
        base44.entities.Employee.list('-created_date', 200),
        base44.entities.Certificate.list('-created_date', 200),
      ]);
      setEmployees(e); setCertificates(c);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const setEF = (f) => (e) => setEmpForm({ ...empForm, [f]: e.target.value });
  const setCF = (f) => (e) => setCertForm({ ...certForm, [f]: e.target.value });

  const openNewEmp = () => { setEditingEmp(null); setEmpForm(EMPTY_EMP); setEmpDialog(true); };
  const openEditEmp = (emp) => { setEditingEmp(emp); setEmpForm({ ...EMPTY_EMP, ...emp }); setEmpDialog(true); };

  const saveEmp = async () => {
    if (!empForm.name) return;
    setSavingEmp(true);
    try {
      const payload = { ...empForm, hourly_rate: Number(empForm.hourly_rate) || 0 };
      if (editingEmp) await base44.entities.Employee.update(editingEmp.id, payload);
      else await base44.entities.Employee.create(payload);
      setEmpDialog(false); load();
    } catch (e) { console.error(e); }
    finally { setSavingEmp(false); }
  };

  const removeEmp = async (id) => {
    if (!confirm('Slet medarbejder og tilknyttede certifikater?')) return;
    const empCerts = certificates.filter((c) => c.employee_id === id);
    await Promise.all(empCerts.map((c) => base44.entities.Certificate.delete(c.id)));
    await base44.entities.Employee.delete(id);
    load();
  };

  const openNewCert = (emp) => {
    setEditingCert(null);
    setCertForm({ ...EMPTY_CERT, employee_id: emp.id, employee_name: emp.name });
    setCertDialog(true);
  };
  const openEditCert = (cert) => { setEditingCert(cert); setCertForm({ ...EMPTY_CERT, ...cert }); setCertDialog(true); };

  const saveCert = async () => {
    if (!certForm.title || !certForm.employee_id) return;
    setSavingCert(true);
    try {
      const emp = employees.find((e) => e.id === certForm.employee_id);
      const payload = { ...certForm, employee_name: emp?.name || certForm.employee_name };
      if (editingCert) await base44.entities.Certificate.update(editingCert.id, payload);
      else await base44.entities.Certificate.create(payload);
      setCertDialog(false); load();
    } catch (e) { console.error(e); }
    finally { setSavingCert(false); }
  };

  const removeCert = async (id) => { await base44.entities.Certificate.delete(id); load(); };

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const days = (d - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 90 && days >= 0;
  };
  const isExpired = (dateStr) => dateStr && new Date(dateStr) < new Date();

  const activeCount = employees.filter((e) => e.status === 'Aktiv').length;
  const expiringCount = certificates.filter((c) => isExpiringSoon(c.expiry_date)).length;
  const expiredCount = certificates.filter((c) => isExpired(c.expiry_date)).length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><UserCog className="w-6 h-6 text-amber-500" /> Medarbejderadministration</h1>
          <p className="text-sm text-slate-500 mt-1">Profiler, fagroller, kontaktinfo og certifikater</p>
        </div>
        <Button onClick={openNewEmp}><Plus className="w-4 h-4" /> Ny medarbejder</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1">Aktive</div><div className="text-2xl font-bold text-emerald-600">{activeCount}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1">Samlede</div><div className="text-2xl font-bold text-slate-900">{employees.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Udløber snart</div><div className="text-2xl font-bold text-amber-600">{expiringCount}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Udløbne cert.</div><div className="text-2xl font-bold text-red-600">{expiredCount}</div></Card>
      </div>

      <div className="space-y-3">
        {employees.map((emp) => {
          const empCerts = certificates.filter((c) => c.employee_id === emp.id);
          const hasExpired = empCerts.some((c) => isExpired(c.expiry_date));
          const isOpen = expanded === emp.id;
          return (
            <Card key={emp.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${emp.status === 'Aktiv' ? 'bg-slate-800' : 'bg-slate-300'}`}>
                      {emp.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{emp.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[emp.status] || ''}`}>{emp.status}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TRADE_BADGE[emp.trade] || ''}`}>{emp.trade}</span>
                        {hasExpired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Udløbet cert.</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                        {emp.email && <a href={`mailto:${emp.email}`} className="flex items-center gap-1 hover:text-slate-600"><Mail className="w-3 h-3" />{emp.email}</a>}
                        {emp.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.phone}</span>}
                        {emp.hourly_rate > 0 && <span>{emp.hourly_rate} kr/t</span>}
                        <span className="flex items-center gap-1"><Award className="w-3 h-3" />{empCerts.length} cert.</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setExpanded(isOpen ? null : emp.id)}>{isOpen ? 'Skjul' : 'Certifikater'}</Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditEmp(emp)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeEmp(emp.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Certifikater</span>
                    <Button variant="outline" size="sm" onClick={() => openNewCert(emp)}><Plus className="w-3.5 h-3.5" /> Tilføj certifikat</Button>
                  </div>
                  {empCerts.length === 0 ? (
                    <p className="text-sm text-slate-400 py-2">Ingen certifikater registreret.</p>
                  ) : (
                    <div className="space-y-2">
                      {empCerts.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isExpired(cert.expiry_date) ? 'bg-red-100' : isExpiringSoon(cert.expiry_date) ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                              <Award className={`w-4 h-4 ${isExpired(cert.expiry_date) ? 'text-red-600' : isExpiringSoon(cert.expiry_date) ? 'text-amber-600' : 'text-emerald-600'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900">{cert.title}</div>
                              <div className="text-xs text-slate-500">{cert.type}</div>
                              <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                                {cert.issue_date && <span>Udstedt: {formatDate(cert.issue_date)}</span>}
                                {cert.expiry_date && (
                                  <span className={isExpired(cert.expiry_date) ? 'text-red-600 font-medium' : isExpiringSoon(cert.expiry_date) ? 'text-amber-600 font-medium' : ''}>
                                    Udløb: {formatDate(cert.expiry_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEditCert(cert)} className="text-slate-400 hover:text-slate-700 p-1"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => removeCert(cert.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {employees.length === 0 && (
          <div className="text-center py-12 text-slate-400"><UserCog className="w-12 h-12 mx-auto mb-2 text-slate-300" />Ingen medarbejdere</div>
        )}
      </div>

      {/* Employee dialog */}
      <Dialog open={empDialog} onOpenChange={setEmpDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingEmp ? 'Rediger medarbejder' : 'Ny medarbejder'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Navn *</Label><Input value={empForm.name} onChange={setEF('name')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={empForm.email || ''} onChange={setEF('email')} /></div>
              <div className="space-y-1.5"><Label>Telefon</Label><Input value={empForm.phone || ''} onChange={setEF('phone')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Fagrolle</Label>
                <Select value={empForm.trade} onValueChange={(v) => setEmpForm({ ...empForm, trade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={empForm.status} onValueChange={(v) => setEmpForm({ ...empForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Timepris (DKK)</Label><Input type="number" value={empForm.hourly_rate || 0} onChange={(e) => setEmpForm({ ...empForm, hourly_rate: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Noter</Label><Textarea value={empForm.notes || ''} onChange={setEF('notes')} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpDialog(false)}>Annuller</Button>
            <Button onClick={saveEmp} disabled={savingEmp || !empForm.name}>{savingEmp && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate dialog */}
      <Dialog open={certDialog} onOpenChange={setCertDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingCert ? 'Rediger certifikat' : 'Nyt certifikat'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Certifikatnavn *</Label><Input value={certForm.title} onChange={setCF('title')} placeholder="F.eks. Gravemaskineførerbevis type B" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={certForm.type} onValueChange={(v) => setCertForm({ ...certForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CERT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Medarbejder</Label>
                <Select value={certForm.employee_id} onValueChange={(v) => setCertForm({ ...certForm, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Vælg" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Udstedt</Label><Input type="date" value={certForm.issue_date || ''} onChange={setCF('issue_date')} /></div>
              <div className="space-y-1.5"><Label>Udløb</Label><Input type="date" value={certForm.expiry_date || ''} onChange={setCF('expiry_date')} /></div>
            </div>
            <div className="space-y-1.5"><Label>Noter</Label><Textarea value={certForm.notes || ''} onChange={setCF('notes')} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertDialog(false)}>Annuller</Button>
            <Button onClick={saveCert} disabled={savingCert || !certForm.title || !certForm.employee_id}>{savingCert && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}