import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';

const PRIORITY = { Lav: 'bg-slate-100 text-slate-600', Normal: 'bg-blue-100 text-blue-700', Høj: 'bg-amber-100 text-amber-700', Vigtig: 'bg-red-100 text-red-700' };

export default function Medarbejderbeskeder() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.InternalMessage.list('-created_date', 200).catch(() => []);
      setMessages(all || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = base44.entities.InternalMessage.subscribe(() => load());
    return unsub;
  }, [load]);

  const inbox = messages.filter((m) => m.is_reply !== true);
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

  const fmtDate = (d) => d ? new Date(d).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center"><MessageSquare className="w-6 h-6 text-amber-600" /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Medarbejderbeskeder</h1>
          <p className="text-slate-500 mt-0.5">Beskeder fra medarbejdere via mobil-appen</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" /></div>
      ) : inbox.length === 0 ? (
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
      )}

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
    </div>
  );
}