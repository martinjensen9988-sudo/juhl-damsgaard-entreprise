import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDKK, calcTotal, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Target, TrendingUp } from 'lucide-react';

const STAGES = [
  { key: 'Nyt lead', dot: 'bg-slate-400', header: 'text-slate-700' },
  { key: 'Kontaktet', dot: 'bg-blue-500', header: 'text-blue-700' },
  { key: 'Tilbud sendt', dot: 'bg-amber-500', header: 'text-amber-700' },
  { key: 'Forhandling', dot: 'bg-purple-500', header: 'text-purple-700' },
  { key: 'Vundet', dot: 'bg-emerald-500', header: 'text-emerald-700' },
  { key: 'Tabt', dot: 'bg-red-400', header: 'text-red-600' },
];

const SOURCES = ['Hjemmeside', 'Telefon', 'Henvisning', 'Facebook', 'Google', 'Andet'];
const TYPES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Andet'];

const EMPTY = {
  name: '', customer_name: '', customer_email: '', customer_phone: '',
  source: 'Hjemmeside', description: '', estimated_value: '', stage: 'Nyt lead',
  project_type: 'Anlæg', assigned_to: '', due_date: '',
};

export default function Salgsoverblik() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Lead.list('-created_date', 200);
      setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStage = result.destination.droppableId;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
    try {
      await base44.entities.Lead.update(leadId, { stage: newStage });
    } catch (e) {
      console.error(e);
      load();
    }
  };

  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (lead) => { setForm({ ...EMPTY, ...lead, estimated_value: lead.estimated_value ?? '' }); setEditing(lead); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, estimated_value: form.estimated_value ? Number(form.estimated_value) : null };
      if (editing) {
        await base44.entities.Lead.update(editing.id, payload);
      } else {
        await base44.entities.Lead.create(payload);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Slet dette lead?')) return;
    await base44.entities.Lead.delete(id);
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const pipelineValue = leads
    .filter((l) => l.stage !== 'Vundet' && l.stage !== 'Tabt')
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const wonValue = leads.filter((l) => l.stage === 'Vundet').reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const wonCount = leads.filter((l) => l.stage === 'Vundet').length;
  const closedCount = wonCount + leads.filter((l) => l.stage === 'Tabt').length;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Salgsoverblik</h1>
          <p className="text-slate-500 mt-1">Lead pipeline – fra første kontakt til vunden opgave</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Nyt lead
        </Button>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><Target className="w-4 h-4" /> Pipeline værdi</div>
          <div className="text-xl font-bold text-slate-900">{formatDKK(pipelineValue)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><TrendingUp className="w-4 h-4" /> Vundet</div>
          <div className="text-xl font-bold text-emerald-600">{formatDKK(wonValue)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-slate-500 text-sm mb-1">Win rate</div>
          <div className="text-xl font-bold text-slate-900">{winRate}%</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-slate-500 text-sm mb-1">Aktive leads</div>
          <div className="text-xl font-bold text-slate-900">{leads.filter((l) => l.stage !== 'Vundet' && l.stage !== 'Tabt').length}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage.key);
              const stageValue = stageLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
              return (
                <Droppable droppableId={stage.key} key={stage.key}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="w-72 shrink-0">
                      <div className="bg-slate-100 rounded-lg p-3 min-h-[200px]">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`}></span>
                            <span className={`font-semibold text-sm ${stage.header}`}>{stage.key}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">{stageLeads.length}</span>
                        </div>
                        <div className="text-xs text-slate-400 mb-2 px-1">{formatDKK(stageValue)}</div>
                        <div className="space-y-2">
                          {stageLeads.map((lead, index) => (
                            <Draggable draggableId={lead.id} index={index} key={lead.id}>
                              {(prov) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-sm text-slate-900 truncate">{lead.name}</div>
                                      <div className="text-xs text-slate-500 truncate">{lead.customer_name || '—'}</div>
                                    </div>
                                    <div className="flex gap-0.5 shrink-0">
                                      <button onClick={() => openEdit(lead)} className="text-slate-400 hover:text-slate-700 p-0.5">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={() => remove(lead.id)} className="text-slate-400 hover:text-red-500 p-0.5">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  {lead.estimated_value != null && (
                                    <div className="text-sm font-semibold text-slate-900 mt-1.5">{formatDKK(lead.estimated_value)}</div>
                                  )}
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{lead.project_type}</span>
                                    {lead.due_date && <span className="text-xs text-slate-400">{formatDate(lead.due_date)}</span>}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger lead' : 'Nyt lead'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Navn *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="F.eks. Badeværelse renovering" />
            </div>
            <div className="space-y-1.5">
              <Label>Kunde</Label>
              <Input value={form.customer_name} onChange={set('customer_name')} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={form.customer_phone} onChange={set('customer_phone')} />
            </div>
            <div className="space-y-1.5">
              <Label>Estimeret værdi (DKK)</Label>
              <Input type="number" value={form.estimated_value} onChange={set('estimated_value')} />
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input type="date" value={form.due_date} onChange={set('due_date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Kilde</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Beskrivelse</Label>
              <Textarea value={form.description} onChange={set('description')} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}