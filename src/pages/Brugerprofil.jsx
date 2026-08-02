import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRound, HardHat, ListChecks, Save, Mail, Clock, MapPin, Calendar } from 'lucide-react';

const statusBadge = {
  'I gang': 'bg-emerald-100 text-emerald-700',
  'Planlægning': 'bg-amber-100 text-amber-700',
  'Afsluttet': 'bg-slate-100 text-slate-600',
  'På hold': 'bg-blue-100 text-blue-700',
};

export default function Brugerprofil() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({ phone_number: '', preferred_language: 'Dansk', notification_email: true, notification_sms: false });

  const load = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      setPrefs({
        phone_number: u.phone_number || '',
        preferred_language: u.preferred_language || 'Dansk',
        notification_email: u.notification_email ?? true,
        notification_sms: u.notification_sms ?? false,
      });
      const res = await base44.functions.invoke('getEmployeeProfile', {});
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const savePrefs = async () => {
    setSaving(true);
    try { await base44.auth.updateMe(prefs); setUser((u) => ({ ...u, ...prefs })); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  if (!user) return null;

  const activeProjects = data?.activeProjects || [];
  const tasks = data?.tasks || [];
  const totalHours = data?.totalHours || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Min profil</h1>
      <p className="text-sm text-slate-500 mb-6">Dine tildelte opgaver og aktive projekter</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center"><UserRound className="w-8 h-8 text-amber-600" /></div>
          <div>
            <div className="text-xl font-bold text-slate-900">{user.full_name || '—'}</div>
            <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5" /> {user.email}</div>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{user.role === 'admin' ? 'Administrator' : 'Medarbejder'}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><HardHat className="w-3.5 h-3.5" /> Aktive projekter</div><div className="text-xl font-bold text-slate-900">{activeProjects.length}</div></div>
          <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><ListChecks className="w-3.5 h-3.5" /> Åbne opgaver</div><div className="text-xl font-bold text-slate-900">{tasks.length}</div></div>
          <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Timer i alt</div><div className="text-xl font-bold text-slate-900">{totalHours}t</div></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Mine aktive projekter</h2>
        {activeProjects.length === 0 ? <p className="text-sm text-slate-400">Du er ikke tildelt nogen aktive projekter</p> : (
          <div className="space-y-3">
            {activeProjects.map((p, i) => (
              <div key={i} className="bg-slate-50 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><HardHat className="w-4 h-4 text-slate-400" /><span className="text-sm font-medium text-slate-700">{p.name}</span></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[p.status] || statusBadge['Planlægning']}`}>{p.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  {p.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.address}</span>}
                  {(p.start_date || p.end_date) && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.start_date ? formatDate(p.start_date) : '—'} → {p.end_date ? formatDate(p.end_date) : '—'}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.hours}t registreret</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Mine opgaver</h2>
        {tasks.length === 0 ? <p className="text-sm text-slate-400">Ingen tildelte opgaver</p> : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-700">{t.title}</div>
                  {t.description && <div className="text-xs text-slate-400 mt-0.5">{t.description}</div>}
                  {t.due_date && <div className="text-xs text-slate-400 mt-0.5">Deadline: {formatDate(t.due_date)}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'I gang' ? 'bg-blue-100 text-blue-700' : t.status === 'Afventer' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{t.status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === 'Høj' ? 'bg-red-100 text-red-700' : t.priority === 'Lav' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{t.priority || 'Normal'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Personlige præferencer</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Telefonnummer</Label><Input value={prefs.phone_number} onChange={(e) => setPrefs((p) => ({ ...p, phone_number: e.target.value }))} /></div>
          <div><Label>Foretrukket sprog</Label><Input value={prefs.preferred_language} onChange={(e) => setPrefs((p) => ({ ...p, preferred_language: e.target.value }))} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="notif_email" checked={prefs.notification_email} onChange={(e) => setPrefs((p) => ({ ...p, notification_email: e.target.checked }))} className="w-4 h-4" /><Label htmlFor="notif_email" className="cursor-pointer">Email-notifikationer</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="notif_sms" checked={prefs.notification_sms} onChange={(e) => setPrefs((p) => ({ ...p, notification_sms: e.target.checked }))} className="w-4 h-4" /><Label htmlFor="notif_sms" className="cursor-pointer">SMS-notifikationer</Label></div>
        </div>
        <Button onClick={savePrefs} disabled={saving} className="gap-2 mt-4"><Save className="w-4 h-4" /> {saving ? 'Gemmer...' : 'Gem præferencer'}</Button>
      </div>
    </div>
  );
}