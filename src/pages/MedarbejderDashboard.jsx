import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate, formatDKK } from '@/lib/format';
import { Plus, Pencil, Trash2, Clock, ListChecks, MessageSquare, Play, Square, Briefcase, Calendar, Megaphone, X } from 'lucide-react';

export default function MedarbejderDashboard() {
  const [user, setUser] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [form, setForm] = useState({ project_id: '', project_name: '', description: '', date: new Date().toISOString().split('T')[0], hours: '' });
  const [msgForm, setMsgForm] = useState({ title: '', message: '', priority: 'Normal' });

  const load = async () => {
    setLoading(true);
    try {
      const [u, te, tk, msg, pr] = await Promise.all([
        base44.auth.me().catch(()=>null),
        base44.entities.TimeEntry.list().catch(()=>[]),
        base44.entities.Task.list().catch(()=>[]),
        base44.entities.InternalMessage.filter({ active: true }).catch(()=>[]),
        base44.entities.Project.list().catch(()=>[]),
      ]);
      setUser(u);
      setTimeEntries(te||[]);
      setTasks(tk||[]);
      setMessages(msg||[]);
      setProjects(pr||[]);
    } catch(e){ console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!timerStart) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - timerStart)/1000)), 1000);
    return () => clearInterval(interval);
  }, [timerStart]);

  const startTimer = (taskId = null, taskTitle = '') => {
    setActiveTimer({ taskId, taskTitle });
    setTimerStart(Date.now());
    setElapsed(0);
  };

  const stopTimer = async () => {
    if (!activeTimer || !timerStart) return;
    const hours = Math.max(0.25, Math.round((elapsed / 3600) * 4) / 4);
    try {
      await base44.entities.TimeEntry.create({
        description: activeTimer.taskTitle || 'Arbejde',
        date: new Date().toISOString().split('T')[0],
        hours,
      });
    } catch(e){}
    setActiveTimer(null);
    setTimerStart(null);
    setElapsed(0);
    load();
  };

  const myTasks = tasks.filter(t => t.assigned_to === user?.full_name || !t.assigned_to).slice(0, 10);
  const myHours = timeEntries.reduce((s, t) => s + (t.hours || 0), 0);
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'Afsluttet').length;

  const saveTime = async () => {
    if (!form.hours) { alert('Angiv timer'); return; }
    try {
      await base44.entities.TimeEntry.create({ ...form, hours: Number(form.hours) });
      setDialogOpen(false);
      setForm({ project_id: '', project_name: '', description: '', date: new Date().toISOString().split('T')[0], hours: '' });
      load();
    } catch(e){ alert('Fejl'); }
  };

  const saveMsg = async () => {
    if (!msgForm.title || !msgForm.message) { alert('Udfyld titel og besked'); return; }
    try {
      await base44.entities.InternalMessage.create({ ...msgForm, author_name: user?.full_name || 'Admin', category: 'Generel', active: true });
      setMsgOpen(false);
      setMsgForm({ title: '', message: '', priority: 'Normal' });
      load();
    } catch(e){ alert('Fejl'); }
  };

  const deleteMsg = async (id) => { if (confirm('Slet besked?')) { try { await base44.entities.InternalMessage.delete(id); load(); } catch(e){} } };

  const priorityColors = { Lav: 'bg-slate-100 text-slate-600', Normal: 'bg-blue-100 text-blue-700', Høj: 'bg-amber-100 text-amber-700', Vigtig: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Briefcase className="w-5 h-5 text-amber-600" /></div>
        <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Mit Dashboard</h1><p className="text-slate-500 mt-0.5">Hej{user?.full_name ? `, ${user.full_name}` : ''}! Her er dit daglige overblik</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Mine timer</div><div className="text-2xl font-bold text-slate-900">{myHours} t</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Aktive opgaver</div><div className="text-2xl font-bold text-amber-600">{activeTasks}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Beskeder</div><div className="text-2xl font-bold text-blue-600">{messages.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Projekter</div><div className="text-2xl font-bold text-emerald-600">{projects.filter(p=>p.status==='I gang').length}</div></div>
      </div>

      {/* Active timer */}
      {activeTimer && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <div className="flex-1"><div className="font-medium text-slate-900">{activeTimer.taskTitle || 'Arbejde'}</div><div className="text-sm text-slate-500">Tid: {Math.floor(elapsed/3600)}t {Math.floor((elapsed%3600)/60)}m {elapsed%60}s</div></div>
          <Button variant="default" onClick={stopTimer} className="bg-red-500 hover:bg-red-600"><Square className="w-4 h-4" /> Stop & gem</Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-900 flex items-center gap-2"><ListChecks className="w-5 h-5 text-amber-600" /> Mine opgaver</h3><Button variant="outline" size="sm" onClick={()=>setDialogOpen(true)}><Plus className="w-4 h-4" /> Registrer tid</Button></div>
          {myTasks.length === 0 ? <p className="text-sm text-slate-400 py-8 text-center">Ingen opgaver tildelt</p> : (
            <div className="space-y-2">{myTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition">
                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium text-slate-900 truncate">{t.title || t.description}</div>{t.project_name && <div className="text-xs text-slate-500">{t.project_name}</div>}</div>
                {!activeTimer && <Button variant="ghost" size="sm" onClick={()=>startTimer(t.id, t.title || t.description)}><Play className="w-3.5 h-3.5" /></Button>}
              </div>
            ))}</div>
          )}
        </div>

        {/* Messages */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-900 flex items-center gap-2"><Megaphone className="w-5 h-5 text-amber-600" /> Beskeder</h3><Button variant="ghost" size="sm" onClick={()=>setMsgOpen(true)}><Plus className="w-4 h-4" /></Button></div>
          {messages.length === 0 ? <p className="text-sm text-slate-400 py-8 text-center">Ingen aktive beskeder</p> : (
            <div className="space-y-3">{messages.slice(0,8).map(m => (
              <div key={m.id} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[m.priority]||priorityColors.Normal}`}>{m.priority}</span>{m.author_name && <span className="text-xs text-slate-400">{m.author_name}</span>}</div>
                <div className="text-sm font-medium text-slate-900">{m.title}</div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.message}</p>
                <button onClick={()=>deleteMsg(m.id)} className="text-xs text-red-500 hover:text-red-600 mt-1">Slet</button>
              </div>
            ))}</div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/opgaveliste" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition flex items-center gap-3"><ListChecks className="w-5 h-5 text-amber-600" /><span className="text-sm font-medium text-slate-900">Opgaveliste</span></Link>
        <Link to="/tidsregistrering" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition flex items-center gap-3"><Clock className="w-5 h-5 text-amber-600" /><span className="text-sm font-medium text-slate-900">Tidsregistrering</span></Link>
        <Link to="/projekter" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition flex items-center gap-3"><Briefcase className="w-5 h-5 text-amber-600" /><span className="text-sm font-medium text-slate-900">Projekter</span></Link>
        <Link to="/sikkerhedsprotokoller" className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition flex items-center gap-3"><Calendar className="w-5 h-5 text-amber-600" /><span className="text-sm font-medium text-slate-900">Sikkerhed</span></Link>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Registrer tid</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Projekt</Label><Select value={form.project_id} onValueChange={(id)=>{const p=projects.find(x=>x.id===id);setForm(f=>({...f,project_id:id,project_name:p?.name||''}));}}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent><SelectItem value={null}>Ingen projekt</SelectItem>{projects.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Beskrivelse</Label><Input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Dato</Label><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div><div><Label>Timer</Label><Input type="number" step="0.25" value={form.hours} onChange={e=>setForm(f=>({...f,hours:e.target.value}))} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={saveTime}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Ny besked</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Titel</Label><Input value={msgForm.title} onChange={e=>setMsgForm(f=>({...f,title:e.target.value}))} /></div>
            <div><Label>Besked</Label><Textarea value={msgForm.message} onChange={e=>setMsgForm(f=>({...f,message:e.target.value}))} rows={3} /></div>
            <div><Label>Prioritet</Label><Select value={msgForm.priority} onValueChange={v=>setMsgForm(f=>({...f,priority:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(priorityColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setMsgOpen(false)}>Annuller</Button><Button onClick={saveMsg}>Opret</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}