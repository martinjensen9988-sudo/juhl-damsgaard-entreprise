import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Check, BookOpen } from 'lucide-react';
import { periodOf } from '@/lib/accounting';

const VAT_CODES = ['none', 'salg25', 'kob25'];
const newLine = () => ({ account_number: '', account_name: '', debit: '', credit: '', vat_code: 'none', description: '' });

export default function Bogfoering() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ entry_number: '', date: new Date().toISOString().slice(0, 10), description: '', status: 'Kladde', lines: [newLine(), newLine()] });

  const load = useCallback(async () => {
    const [e, a] = await Promise.all([
      base44.entities.JournalEntry.list('-date', 500).catch(() => []),
      base44.entities.Account.list('account_number', 500).catch(() => []),
    ]);
    setEntries(e || []); setAccounts(a || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const aMap = {};
  accounts.forEach((a) => (aMap[a.account_number] = a));

  const openNew = () => {
    setEditing(null);
    const num = `J-${new Date().getFullYear()}-${String(entries.length + 1).padStart(4, '0')}`;
    setForm({ entry_number: num, date: new Date().toISOString().slice(0, 10), description: '', status: 'Kladde', lines: [newLine(), newLine()] });
    setOpen(true);
  };
  const openEdit = (it) => { setEditing(it); setForm({ ...it, lines: (it.lines || []).map((l) => ({ ...newLine(), ...l, debit: l.debit || '', credit: l.credit || '' })) }); setOpen(true); };

  const setLine = (idx, key, val) => setForm((f) => {
    const lines = [...f.lines];
    lines[idx] = { ...lines[idx], [key]: val };
    if (key === 'account_number') lines[idx].account_name = aMap[val]?.name || '';
    return { ...f, lines };
  });
  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, newLine()] }));
  const removeLine = (idx) => setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));

  const sumDebet = form.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const sumKredit = form.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = Math.abs(sumDebet - sumKredit) < 0.01 && sumDebet > 0;

  const save = async (post = false) => {
    if (!form.entry_number || !form.date) { alert('Udfyld bilagsnr. og dato'); return; }
    if (!balanced) { alert('Posteringen er ikke i balance (debet skal være lig kredit)'); return; }
    const lines = form.lines.map((l) => ({ ...l, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })).filter((l) => l.account_number);
    if (lines.length < 2) { alert('Tilføj mindst to linjer'); return; }
    const payload = { ...form, date: form.date, period: periodOf(form.date), lines, status: post ? 'Bogført' : form.status, posted_date: post ? new Date().toISOString().slice(0, 10) : null };
    if (editing) await base44.entities.JournalEntry.update(editing.id, payload);
    else await base44.entities.JournalEntry.create(payload);
    setOpen(false); load();
  };

  const remove = async (id) => { if (confirm('Slet postering?')) { await base44.entities.JournalEntry.delete(id); load(); } };
  const post = async (it) => { await base44.entities.JournalEntry.update(it.id, { status: 'Bogført', posted_date: new Date().toISOString().slice(0, 10) }); load(); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6" /> Bogføring</h1>
          <p className="text-sm text-muted-foreground">Dobbelt bogholderi – hver postering skal balancere (debet = kredit).</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny postering</Button>
      </div>

      <div className="grid gap-2">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">Ingen posteringer.</p>}
        {entries.map((e) => {
          const debet = (e.lines || []).reduce((s, l) => s + (Number(l.debit) || 0), 0);
          const kredit = (e.lines || []).reduce((s, l) => s + (Number(l.credit) || 0), 0);
          return (
            <div key={e.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{e.entry_number} • {e.description || '—'}</div>
                  <div className="text-xs text-muted-foreground">{e.date} • Periode {e.period}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${e.status === 'Bogført' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{e.status}</span>
                  <span className="text-sm font-medium">{debet.toLocaleString('da-DK')} DKK</span>
                  {e.status === 'Kladde' && <Button size="sm" variant="outline" onClick={() => post(e)}><Check className="w-3.5 h-3.5" /> Bogfør</Button>}
                  <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="mt-2 grid gap-1 text-xs">
                {(e.lines || []).map((l, i) => (
                  <div key={i} className="flex justify-between">
                    <span><span className="font-mono">{l.account_number}</span> {l.account_name} {l.description ? `· ${l.description}` : ''}</span>
                    <span className="font-mono">{Number(l.debit || 0).toLocaleString('da-DK')} / {Number(l.credit || 0).toLocaleString('da-DK')}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? 'Rediger postering' : 'Ny postering'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Bilagsnr.</Label><Input value={form.entry_number} onChange={(e) => setForm((f) => ({ ...f, entry_number: e.target.value }))} /></div>
            <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Kladde">Kladde</SelectItem><SelectItem value="Bogført">Bogført</SelectItem></SelectContent></Select></div>
            <div className="col-span-3"><Label>Tekst</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Beskrivelse af postering" /></div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Posteringslinjer</Label>
              <Button size="sm" variant="outline" onClick={addLine}><Plus className="w-4 h-4" /> Tilføj linje</Button>
            </div>
            <div className="space-y-1">
              {form.lines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Select value={l.account_number} onValueChange={(v) => setLine(idx, 'account_number', v)}>
                    <SelectTrigger className="col-span-4"><SelectValue placeholder="Konto" /></SelectTrigger>
                    <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.account_number}>{a.account_number} {a.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="col-span-2" type="number" placeholder="Debet" value={l.debit} onChange={(e) => setLine(idx, 'debit', e.target.value)} />
                  <Input className="col-span-2" type="number" placeholder="Kredit" value={l.credit} onChange={(e) => setLine(idx, 'credit', e.target.value)} />
                  <Select value={l.vat_code} onValueChange={(v) => setLine(idx, 'vat_code', v)}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>{VAT_CODES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="col-span-1" onClick={() => removeLine(idx)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm pt-1">
              <span>Total debet: <b>{sumDebet.toLocaleString('da-DK')}</b> • Total kredit: <b>{sumKredit.toLocaleString('da-DK')}</b></span>
              <span className={balanced ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>{balanced ? '✓ I balance' : '✗ Ikke i balance'}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button variant="secondary" onClick={() => save(false)}>Gem kladde</Button>
            <Button onClick={() => save(true)} disabled={!balanced}>Bogfør</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}