import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Plus } from 'lucide-react';
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
  const [form, setForm] = useState({ title: '', message: '', priority: 'Normal' });

  const load = useCallback(async () => {
    const [u, msg] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.InternalMessage.list('-created_date', 50).catch(() => []),
    ]);
    setUser(u);
    setMessages((msg || []).filter((m) => m.active !== false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.message) { alert('Udfyld titel og besked'); return; }
    try {
      await base44.entities.InternalMessage.create({
        ...form,
        author_name: user?.full_name || 'Medarbejder',
        category: 'Generel',
        active: true,
      });
      setOpen(false);
      setForm({ title: '', message: '', priority: 'Normal' });
      load();
    } catch (e) { alert('Kunne ikke sende besked'); }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Beskeder</h1>
        <Button size="sm" onClick={() => setOpen(true)} className="bg-slate-950">
          <Plus className="w-4 h-4" /> Ny
        </Button>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Ingen beskeder</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY[m.priority] || PRIORITY.Normal}`}>{m.priority}</span>
                {m.author_name && <span className="text-[11px] text-slate-400">{m.author_name}</span>}
              </div>
              <div className="text-sm font-semibold text-slate-900">{m.title}</div>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Ny besked</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Titel</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Besked</Label>
              <Textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={4} />
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
            <Button onClick={save} className="bg-slate-950">Send</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}