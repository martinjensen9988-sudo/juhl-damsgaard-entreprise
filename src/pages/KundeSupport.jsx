import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Headphones, Mail, Send, CheckCircle2 } from 'lucide-react';

const STATUSES = ['Åben', 'Besvaret', 'Lukket'];
const STATUS_BADGE = { 'Åben': 'bg-amber-100 text-amber-700', 'Besvaret': 'bg-blue-100 text-blue-700', 'Lukket': 'bg-slate-100 text-slate-500' };
const PRIORITY_BADGE = { 'Høj': 'bg-red-100 text-red-700', 'Normal': 'bg-slate-100 text-slate-600', 'Lav': 'bg-slate-50 text-slate-400' };

export default function KundeSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setTickets(await base44.entities.SupportTicket.list('-created_date', 200));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);
  const openCount = tickets.filter((t) => t.status === 'Åben').length;

  const openTicket = (t) => { setSelected(t); setResponse(t.response || ''); };

  const sendResponse = async () => {
    if (!response.trim() || !selected) return;
    setSending(true);
    try {
      await base44.entities.SupportTicket.update(selected.id, {
        response, status: 'Besvaret', responded_at: new Date().toISOString(),
      });
      if (selected.customer_email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: selected.customer_email,
            subject: `Re: ${selected.subject}`,
            body: response,
          });
        } catch (e) { console.error('Email send failed:', e); }
      }
      setSending(false);
      setSelected(null);
      load();
    } catch (e) { console.error(e); setSending(false); }
  };

  const closeTicket = async (id) => {
    await base44.entities.SupportTicket.update(id, { status: 'Lukket' });
    load();
  };

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kundesupport</h1>
        <p className="text-slate-500 mt-1">Se og besvar kundehenvendelser {openCount > 0 && `· ${openCount} åbne`}</p>
      </div>

      <div className="flex gap-2">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s === 'all' ? 'Alle' : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Headphones className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen henvendelser.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTicket(t)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{t.subject}</div>
                  <div className="text-sm text-slate-500 mt-0.5 truncate">{t.message}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-400">{t.customer_name || t.customer_email}</span>
                    <span className="text-xs text-slate-400">· {formatDate(t.created_date)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[t.status] || 'bg-slate-100'}`}>{t.status}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[t.priority] || 'bg-slate-100'}`}>{t.priority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.subject}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Mail className="w-4 h-4" /> {selected.customer_name || '—'} · {selected.customer_email}
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">{selected.message}</div>
              {selected.response && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="text-xs font-medium text-blue-600 mb-1">Tidligere svar</div>
                  <div className="text-sm text-slate-700">{selected.response}</div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Dit svar</Label>
                <Textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={4} placeholder="Skriv svar til kunden..." />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selected?.status !== 'Lukket' && (
              <Button variant="outline" onClick={() => closeTicket(selected.id)} className="mr-auto">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Luk
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelected(null)}>Annuller</Button>
            <Button onClick={sendResponse} disabled={sending || !response.trim()} className="bg-slate-950 hover:bg-slate-800">
              <Send className="w-4 h-4 mr-1.5" /> {sending ? 'Sender...' : 'Send svar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}