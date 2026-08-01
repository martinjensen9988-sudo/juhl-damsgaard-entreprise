import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { History, Plus, Loader2, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/format';

const ENTITY_TYPES = ['Tilbud', 'Faktura', 'Projekt', 'Kunde', 'Abonnement', 'Indkøbsordre', 'Sikkerhed', 'Andet'];
const ACTIONS = ['Oprettet', 'Opdateret', 'Slettet', 'Accepteret', 'Afvist', 'Godkendt', 'Sendt', 'Betalt', 'Statusændring', 'Andet'];

const TYPE_COLOR = {
  Tilbud: 'bg-blue-100 text-blue-700',
  Faktura: 'bg-emerald-100 text-emerald-700',
  Projekt: 'bg-amber-100 text-amber-700',
  Kunde: 'bg-purple-100 text-purple-700',
  Abonnement: 'bg-indigo-100 text-indigo-700',
  Indkøbsordre: 'bg-cyan-100 text-cyan-700',
  Sikkerhed: 'bg-red-100 text-red-700',
  Andet: 'bg-slate-100 text-slate-600',
};

const EMPTY = { entity_type: 'Andet', entity_name: '', action: 'Andet', user_email: '', user_name: '', details: '' };

export default function Aktivitetslog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLogs(await base44.entities.ActivityLog.list('-created_date', 200));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.entity_type || !form.action) return;
    setSaving(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.ActivityLog.create({
        ...form,
        user_email: form.user_email || me?.email || '',
        user_name: form.user_name || me?.full_name || '',
      });
      setShowDialog(false); setForm(EMPTY); load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { await base44.entities.ActivityLog.delete(id); load(); };

  const filtered = logs
    .filter((l) => filterType === 'all' || l.entity_type === filterType)
    .filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (l.entity_name || '').toLowerCase().includes(q) || (l.user_email || '').toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q);
    });

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><History className="w-6 h-6 text-amber-500" /> Aktivitetslog</h1>
          <p className="text-sm text-slate-500 mt-1">Samlet overblik over vigtige hændelser</p>
        </div>
        <Button onClick={() => setShowDialog(true)}><Plus className="w-4 h-4" /> Manuel indtastning</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Søg..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer</SelectItem>
            {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((l) => (
          <Card key={l.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLOR[l.entity_type] || 'bg-slate-100'}`}>{l.entity_type}</span>
                    <span className="text-sm font-medium text-slate-900">{l.action}</span>
                    {l.entity_name && <span className="text-sm text-slate-600">— {l.entity_name}</span>}
                  </div>
                  {l.details && <p className="text-xs text-slate-500 mt-1">{l.details}</p>}
                  <div className="text-xs text-slate-400 mt-1">
                    {formatDate(l.created_date)}
                    {l.user_name && ` • ${l.user_name}`}
                    {l.user_email && ` (${l.user_email})`}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(l.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400"><History className="w-12 h-12 mx-auto mb-2 text-slate-300" />Ingen hændelser</div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrer hændelse</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Objekttype</Label>
                <Select value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Handling</Label>
                <Select value={form.action} onValueChange={(v) => setForm({ ...form, action: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Objektnavn</Label><Input value={form.entity_name} onChange={set('entity_name')} placeholder="F.eks. tilbudsnr. eller projektnavn" /></div>
            <div className="space-y-1.5"><Label>Detaljer</Label><Textarea value={form.details} onChange={set('details')} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}