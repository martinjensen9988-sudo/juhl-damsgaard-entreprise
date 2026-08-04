import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { STANDARD_KONTOPLAN } from '@/lib/accounting';

const TYPES = ['Aktiv', 'Passiv', 'Indtægt', 'Omkostning', 'Finansiel indtægt', 'Finansiel omkostning'];
const VAT_CODES = ['none', 'salg25', 'kob25'];
const VAT_TYPES = ['none', 'output', 'input'];
const empty = { account_number: '', name: '', type: 'Aktiv', vat_code: 'none', vat_type: 'none', is_active: true, description: '' };

export default function Kontoplan() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => { setItems(await base44.entities.Account.list('account_number', 500).catch(() => [])); }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };

  const save = async () => {
    if (!form.account_number || !form.name) { alert('Udfyld kontonr. og navn'); return; }
    if (editing) await base44.entities.Account.update(editing.id, form);
    else await base44.entities.Account.create(form);
    setOpen(false); load();
  };
  const remove = async (id) => { if (confirm('Slet konto?')) { await base44.entities.Account.delete(id); load(); } };

  const seed = async () => {
    setSeeding(true);
    try {
      await base44.entities.Account.bulkCreate(
        STANDARD_KONTOPLAN.map(([account_number, name, type, vat_code, vat_type]) => ({ account_number, name, type, vat_code, vat_type, is_active: true }))
      );
      load();
    } catch (e) { alert('Kunne ikke indlæse standard kontoplan'); }
    finally { setSeeding(false); }
  };

  const groups = ['Aktiv', 'Passiv', 'Indtægt', 'Omkostning', 'Finansiel indtægt', 'Finansiel omkostning'];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kontoplan</h1>
          <p className="text-sm text-muted-foreground">Dansk standard kontoplan til dobbelt bogholderi.</p>
        </div>
        <div className="flex gap-2">
          {items.length === 0 && <Button variant="outline" onClick={seed} disabled={seeding}><Download className="w-4 h-4" /> {seeding ? 'Indlæser…' : 'Indlæs standard kontoplan'}</Button>}
          <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny konto</Button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Ingen konti endnu. Indlæs den danske standard kontoplan for at starte.</p>
          <Button onClick={seed} disabled={seeding}><Download className="w-4 h-4" /> Indlæs standard kontoplan</Button>
        </div>
      )}

      <div className="space-y-4">
        {groups.map((g) => {
          const accs = items.filter((a) => a.type === g);
          if (accs.length === 0) return null;
          return (
            <div key={g}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{g}</h3>
              <div className="grid gap-2">
                {accs.map((a) => (
                  <div key={a.id} className="rounded-lg border bg-card p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium w-16">{a.account_number}</span>
                      <span className="text-sm">{a.name}</span>
                      {a.vat_code !== 'none' && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">moms: {a.vat_code}</span>}
                      {a.vat_type !== 'none' && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{a.vat_type === 'output' ? 'Udgående moms' : 'Indgående moms'}</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger konto' : 'Ny konto'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Kontonr.</Label><Input value={form.account_number} onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))} placeholder="1000" /></div>
            <div><Label>Kontonavn</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Kontotype</Label><Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Moms kode</Label><Select value={form.vat_code} onValueChange={(v) => setForm((f) => ({ ...f, vat_code: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VAT_CODES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Momskonto</Label><Select value={form.vat_type} onValueChange={(v) => setForm((f) => ({ ...f, vat_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VAT_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex items-center gap-2 pt-6"><input type="checkbox" id="act" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /><Label htmlFor="act">Aktiv</Label></div>
            <div className="col-span-2"><Label>Beskrivelse</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}