import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRound, HardHat, ListChecks, Save, Mail, Briefcase, Clock } from 'lucide-react';

export default function Brugerprofil() {
  const [user, setUser] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [tasks, setTasks] = useState([]);
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
      const [te, allTasks] = await Promise.all([
        base44.entities.TimeEntry.list(),
        base44.entities.Task.list(),
      ]);
      const userName = u.full_name || u.email;
      setTimeEntries(te.filter((t) => t.user_name === userName));
      setTasks(allTasks.filter((t) => t.assigned_to === userName));
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

  const projectMap = {};
  timeEntries.forEach((t) => {
    if (t.project_id) projectMap[t.project_id] = { name: t.project_name || '—', hours: 0 };
  });
  timeEntries.forEach((t) => { if (t.project_id && projectMap[t.project_id]) projectMap[t.project_id].hours += Number(t.hours) || 0; });
  const myProjects = Object.values(projectMap);
  const totalHours = timeEntries.reduce((s, t) => s + (Number(t.hours) || 0), 0);
  const openTasks = tasks.filter((t) => t.status !== 'Gennemført');

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Min profil</h1>
      <p className="text-sm text-slate-500 mb-6">Dine oplysninger, tilknyttede projekter og præferencer</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center"><UserRound className="w-8 h-8 text-amber-600" /></div>
          <div>
            <div className="text-xl font-bold text-slate-900">{user.full_name || '—'}</div>
            <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5" /> {user.email}</div>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{user.role === 'admin' ? 'Administrator' : 'Bruger'}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><HardHat className="w-3.5 h-3.5" /> Projekter</div><div className="text-xl font-bold text-slate-900">{myProjects.length}</div></div>
          <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Timer i alt</div><div className="text-xl font-bold text-slate-900">{totalHours}t</div></div>
          <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><ListChecks className="w-3.5 h-3.5" /> Åbne opgaver</div><div className="text-xl font-bold text-slate-900">{openTasks.length}</div></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Tilknyttede projekter</h2>
        {myProjects.length === 0 ? <p className="text-sm text-slate-400">Ingen projekter</p> : (
          <div className="space-y-2">
            {myProjects.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2"><HardHat className="w-4 h-4 text-slate-400" /><span className="text-sm font-medium text-slate-700">{p.name}</span></div>
                <span className="text-sm text-slate-500">{p.hours}t registreret</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {openTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Mine opgaver</h2>
          <div className="space-y-2">
            {openTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div><div className="text-sm font-medium text-slate-700">{t.title}</div>{t.due_date && <div className="text-xs text-slate-400 mt-0.5">Deadline: {formatDate(t.due_date)}</div>}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === 'Høj' ? 'bg-red-100 text-red-700' : t.priority === 'Lav' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{t.priority || 'Normal'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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