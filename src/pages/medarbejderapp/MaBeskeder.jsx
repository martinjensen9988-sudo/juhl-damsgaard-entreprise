import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Plus, Send, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';

const PRIORITY = { Lav: 'bg-slate-100 text-slate-600', Normal: 'bg-blue-100 text-blue-700', Høj: 'bg-amber-100 text-amber-700', Vigtig: 'bg-red-100 text-red-700' };

export default function MaBeskeder() {
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', priority: 'Normal' });

  const load = useCallback(async () => {
    const [u, msg] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.InternalMessage.list('-created_date', 100).catch(() => []),
    ]);
    setUser(u);
    setMessages((msg || []).filter((m) => m.active !== false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime: opdater når kontoret svarer
  useEffect(() => {
    const unsub = base44.entities.InternalMessage.subscribe(() => { load(); });
    return unsub;
  }, [load]);

  const save = async () => {
    if (!form.title || !form.message) { alert('Udfyld titel og besked'); return; }
    setSending(true);
    try {
      await base44.entities.InternalMessage.create({
        title: form.title,
        message: form.message,
        priority: form.priority,
        author_name: user?.full_name || 'Medarbejder',
        author_email: user?.email || '',
        category: 'Generel',
        is_reply: false,
        active: true,
      });
      setOpen(false);
      setForm({ title: '', message: '', priority: 'Normal' });
      load();
    } catch (e) { alert('Kunne ikke sende besked'); }
    finally { setSending(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="p-4 space-y-3 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Beskeder</h1>
        <Button size="sm" onClick={() => setOpen(true)} className="bg-slate-950">
          <Plus className="w-4 h-4" /> Ny
        </Button>
      </div>
      <p className="text-xs text-slate-500 -mt-1">Send direkte til kontoret – du får svar her.</p>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Ingen beskeder endnu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const fromMe = user && m.created_by_id === user.id;
            const isReply = m.is_reply === true || (m.recipient_user_id && user && m.recipient_user_id === user.id);
            return (
              <div key={m.id} className={`rounded-xl p-4 border ${isReply ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isReply ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />}
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY[m.priority] || PRIORITY.Normal}`}>{m.priority}</span>
                    <span className="text-[11px] text-slate-400">{isReply ? 'Kontoret' : 'Dig'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{fmtDate(m.created_date)}</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{m.message}</p>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Ny besked til kontoret</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Titel</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Emne" />
            </div>
            <div>
              <Label>Besked</Label>
              <Textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={4} placeholder="Skriv din besked til kontoret..." />
            </div>
            <div>
              <Label>Prioritet</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(PRIORITY).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={sending} className="bg-slate-950">
              {sending ? 'Sender...' : <><Send className="w-4 h-4" /> Send</>}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}