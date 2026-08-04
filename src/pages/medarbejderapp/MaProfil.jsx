import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Mail, Phone, Award, Calendar, Briefcase, Plus, LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';

export default function MaProfil() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [vacations, setVacations] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    type: 'Ferie',
    notes: '',
  });

  const load = useCallback(async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (u) {
      const emps = await base44.entities.Employee.filter({ email: u.email }).catch(() => []);
      setEmployee(emps[0] || null);
      const v = await base44.entities.VacationRequest.list('-submitted_date', 20).catch(() => []);
      setVacations((v || []).filter((x) => !x.employee_name || x.employee_name === u.full_name));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveVacation = async () => {
    if (!user?.full_name) { alert('Profil ikke tilgængelig'); return; }
    try {
      await base44.entities.VacationRequest.create({
        employee_name: user.full_name,
        employee_email: user.email,
        start_date: form.start_date,
        end_date: form.end_date,
        type: form.type,
        notes: form.notes,
        status: 'Afventer',
        submitted_date: new Date().toISOString().split('T')[0],
      });
      setOpen(false);
      setForm({ start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], type: 'Ferie', notes: '' });
      load();
    } catch (e) { alert('Kunne ikke indsende anmodning'); }
  };

  const statusColor = { Afventer: 'bg-amber-100 text-amber-700', Godkendt: 'bg-emerald-100 text-emerald-700', Afvist: 'bg-red-100 text-red-700', Annulleret: 'bg-slate-100 text-slate-500' };

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Min profil</h1>

      {/* Profile card */}
      <div className="bg-slate-950 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-bold text-2xl">
            {user?.full_name?.charAt(0) || <User className="w-7 h-7" />}
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">{user?.full_name || 'Medarbejder'}</div>
            {employee?.position && <div className="text-sm text-slate-300">{employee.position}</div>}
            {employee?.trade && <div className="text-xs text-amber-400 mt-0.5">{employee.trade}</div>}
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <h2 className="font-semibold text-slate-900 text-sm">Kontaktoplysninger</h2>
        {user?.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">{user.email}</span>
          </div>
        )}
        {employee?.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">{employee.phone}</span>
          </div>
        )}
        {employee?.hire_date && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">Ansættet: {employee.hire_date}</span>
          </div>
        )}
        {employee?.hourly_rate != null && (
          <div className="flex items-center gap-3 text-sm">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">Timepris: {employee.hourly_rate} DKK</span>
          </div>
        )}
        {!employee && (
          <p className="text-xs text-slate-400">Ingen medarbejderprofil knyttet til din konto.</p>
        )}
      </div>

      {/* Competencies */}
      {employee?.competencies && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-amber-500" /> Kompetencer</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{employee.competencies}</p>
        </div>
      )}
      {employee?.certificates && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-emerald-500" /> Certifikater</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{employee.certificates}</p>
        </div>
      )}

      {/* Vacation requests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-900 text-sm">Ferie & fravær</h2>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> Anmod
          </Button>
        </div>
        {vacations.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Ingen anmodninger</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vacations.map((v) => (
              <div key={v.id} className="bg-white rounded-xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{v.type}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor[v.status] || statusColor.Afventer}`}>{v.status}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{v.start_date} – {v.end_date}</div>
                {v.notes && <p className="text-xs text-slate-400 mt-1">{v.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => base44.auth.logout('/login')}>
        <LogOut className="w-4 h-4" /> Log ud
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Anmod om fravær</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Ferie', 'Afspadsering', 'Sygdom', 'Fri', 'Andet'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fra</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>Til</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Bemærkning</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={saveVacation} className="bg-slate-950">Indsend</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}