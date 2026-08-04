import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, Building2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRIORITY = { Lav: 'bg-slate-100 text-slate-600', Normal: 'bg-blue-100 text-blue-700', Høj: 'bg-amber-100 text-amber-700', Vigtig: 'bg-red-100 text-red-700' };

export default function Medarbejderbeskeder() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [bc, setBc] = useState({ title: '', message: '', priority: 'Normal' });
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, userList] = await Promise.all([
        base44.entities.InternalMessage.list('-created_date', 200).catch(() => []),
        base44.entities.User.list().catch(() => []),
      ]);
      setMessages(all || []);
      setUsers((userList || []).filter((u) => u.role !== 'admin'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = base44.entities.InternalMessage.subscribe(() => load());
    return unsub;
  }, [load]);

  const inbox = messages.filter((m) => m.is_reply !== true && m.is_broadcast !== true);
  const sent = messages.filter((m) => m.is_broadcast === true);
  const repliesFor = (id) => messages.filter((m) => m.parent_id === id);

  const sendReply = async () => {
    if (!replyText.trim() || !replyTo) return;
    setSending(true);
    try {
      await base44.entities.InternalMessage.create({
        title: `Svar: ${replyTo.title}`,
        message: replyText,
        priority: replyTo.priority || 'Normal',
        author_name: 'Kontoret',
        category: 'Generel',
        is_reply: true,
        parent_id: replyTo.id,
        recipient_user_id: replyTo.created_by_id,
        active: true,
      });
      setReplyTo(null);
      setReplyText('');
      load();
    } catch (e) { alert('Kunne ikke sende svar'); }
    finally { setSending(false); }
  };

  const toggleRecipient = (id) => {
    setRecipients((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const sendBroadcast = async () => {
    if (!bc.title || !bc.message) { alert('Udfyld titel og besked'); return; }
    if (recipients.length === 0) { alert('Vælg mindst én modtager'); return; }
    setSending(true);
    try {
      const payload = recipients.map((uid) => ({
        title: bc.title,
        message: bc.message,
        priority: bc.priority,
        author_name: 'Kontoret',
        category: 'Generel',
        is_broadcast: true,
        recipient_user_id: uid,
        active: true,
      }));
      await base44.entities.InternalMessage.bulkCreate(payload);
      setBroadcastOpen(false);
      setBc({ title: '', message: '', priority: 'Normal' });
      setRecipients([]);
      setTab('sent');
      load();
    } catch (e) { alert('Kunne ikke udsende besked'); }
    finally { setSending(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  const recipientNames = (m) => {
    const ids = messages.filter((x) => x.title === m.title && x.is_broadcast === true && x.author_name === 'Kontoret').map((x) => x.recipient_user_id);
    return ids.length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center"><MessageSquare className="w-6 h-6 text-amber-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Medarbejderbeskeder</h1>
            <p className="text-slate-500 mt-0.5">Modtag og udsend beskeder til medarbejdere på mobil</p>
          </div>
        </div>
        <Button onClick={() => { setRecipients(users.map((u) => u.id)); setBroadcastOpen(true); }} className="bg-slate-950">
          <Megaphone className="w-4 h-4 mr-1.5" /> Ny udsendelse
        </Button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('inbox')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'inbox' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
          Indbakke ({inbox.length})
        </button>
        <button onClick={() => setTab('sent')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'sent' ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
          Udsendte ({sent.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" /></div>
      ) : tab === 'inbox' ? (
        inbox.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen beskeder fra medarbejdere.</p></div>
        ) : (
          <div className="space-y-3">
            {inbox.map((m) => {
              const replies = repliesFor(m.id);
              return (
                <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY[m.priority] || PRIORITY.Normal}`}>{m.priority}</span>
                    <span className="text-[11px] text-slate-400">{fmtDate(m.created_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Building2 className="w-3.5 h-3.5" /> {m.author_name || 'Medarbejder'}{m.author_email ? ` · ${m.author_email}` : ''}</div>
                  <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{m.message}</p>
                  {replies.length > 0 && (
                    <div className="mt-3 pl-3 border-l-2 border-emerald-300 space-y-2">
                      {replies.map((r) => (
                        <div key={r.id} className="bg-emerald-50 rounded-lg p-2.5">
                          <div className="text-[11px] text-emerald-700 mb-0.5">{r.author_name || 'Kontoret'} · {fmtDate(r.created_date)}</div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { setReplyTo(m); setReplyText(''); }}>
                    <Send className="w-3.5 h-3.5" /> Svar
                  </Button>
                </div>
              );
            })}
          </div>
        )
      ) : (
        sent.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen udsendte beskeder endnu.</p></div>
        ) : (
          <div className="space-y-3">
            {sent.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY[m.priority] || PRIORITY.Normal}`}>{m.priority}</span>
                  <span className="text-[11px] text-slate-400">{fmtDate(m.created_date)}</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{m.message}</p>
                <div className="text-[11px] text-slate-400 mt-1">Til: {users.find((u) => u.id === m.recipient_user_id)?.full_name || 'Medarbejder'}</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Reply sheet */}
      <Sheet open={!!replyTo} onOpenChange={(o) => !o && setReplyTo(null)}>
        <SheetContent side="right" className="max-w-md">
          <SheetHeader><SheetTitle>Svar til {replyTo?.author_name || 'medarbejder'}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            {replyTo && <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600"><div className="font-medium text-slate-800 mb-0.5">{replyTo.title}</div>{replyTo.message}</div>}
            <div>
              <Label>Dit svar</Label>
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={5} placeholder="Skriv svar..." />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setReplyTo(null)}>Annuller</Button>
            <Button onClick={sendReply} disabled={sending || !replyText.trim()} className="bg-slate-950">{sending ? 'Sender...' : 'Send svar'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Broadcast sheet */}
      <Sheet open={broadcastOpen} onOpenChange={(o) => !o && setBroadcastOpen(false)}>
        <SheetContent side="right" className="max-w-md">
          <SheetHeader><SheetTitle>Ny udsendelse til medarbejdere</SheetTitle></SheetHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Titel</Label>
              <Input value={bc.title} onChange={(e) => setBc((f) => ({ ...f, title: e.target.value }))} placeholder="Emne" />
            </div>
            <div>
              <Label>Besked</Label>
              <Textarea value={bc.message} onChange={(e) => setBc((f) => ({ ...f, message: e.target.value }))} rows={4} placeholder="Kort besked til medarbejderne..." />
            </div>
            <div>
              <Label>Prioritet</Label>
              <Select value={bc.priority} onValueChange={(v) => setBc((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(PRIORITY).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Modtagere ({recipients.length} valgt)</Label>
                <button onClick={() => setRecipients(recipients.length === users.length ? [] : users.map((u) => u.id))} className="text-xs text-amber-600">
                  {recipients.length === users.length ? 'Fravælg alle' : 'Vælg alle'}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-2 bg-slate-50">
                {users.length === 0 && <p className="text-xs text-slate-400 p-2">Ingen medarbejdere fundet.</p>}
                {users.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 p-2 rounded hover:bg-white cursor-pointer">
                    <input type="checkbox" checked={recipients.includes(u.id)} onChange={() => toggleRecipient(u.id)} className="rounded" />
                    <span className="text-sm text-slate-700">{u.full_name || u.email}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setBroadcastOpen(false)}>Annuller</Button>
            <Button onClick={sendBroadcast} disabled={sending || !bc.title || !bc.message || recipients.length === 0} className="bg-slate-950">
              <Megaphone className="w-4 h-4" /> {sending ? 'Sender...' : `Send til ${recipients.length}`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}