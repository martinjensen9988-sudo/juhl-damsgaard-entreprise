import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { formatDKK, formatDate } from '@/lib/format';
import {
  Plus, Phone, Mail, Globe, Users, User, Calendar, TrendingUp, Trophy,
} from 'lucide-react';

const STAGES = [
  { key: 'Nyt lead', accent: 'border-t-slate-400', header: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  { key: 'Kontaktet', accent: 'border-t-blue-400', header: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  { key: 'Tilbud sendt', accent: 'border-t-amber-400', header: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  { key: 'Forhandling', accent: 'border-t-purple-400', header: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  { key: 'Vundet', accent: 'border-t-emerald-400', header: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  { key: 'Tabt', accent: 'border-t-red-400', header: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
];

const SOURCES = ['Hjemmeside', 'Telefon', 'Henvisning', 'Facebook', 'Google', 'Andet'];
const PROJECT_TYPES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Andet'];

const SOURCE_ICON = {
  'Hjemmeside': Globe, 'Telefon': Phone, 'Henvisning': Users,
  'Facebook': Mail, 'Google': Globe, 'Andet': Mail,
};

const EMPTY = { name: '', customer_name: '', customer_email: '', customer_phone: '', source: 'Hjemmeside', project_type: 'Anlæg', estimated_value: '', description: '', assigned_to: '' };

export default function SalgsPipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setLeads(await base44.entities.Lead.list('-created_date', 200));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStage = destination.droppableId;
    const lead = leads.find((l) => l.id === draggableId);
    if (!lead || lead.stage === newStage) return;
    try {
      await base44.entities.Lead.update(draggableId, { stage: newStage });
      setLeads(leads.map((l) => (l.id === draggableId ? { ...l, stage: newStage } : l)));
    } catch (e) { console.error(e); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Lead.create({
        ...form,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : 0,
        stage: 'Nyt lead',
      });
      setDialogOpen(false);
      setForm(EMPTY);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const totalValue = leads.filter((l) => l.stage === 'Vundet').reduce((s, l) => s + (l.estimated_value || 0), 0);
  const pipelineValue = leads.filter((l) => !['Vundet', 'Tabt'].includes(l.stage)).reduce((s, l) => s + (l.estimated_value || 0), 0);
  const wonCount = leads.filter((l) => l.stage === 'Vundet').length;
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Salgspipeline</h1>
          <p className="text-slate-500 mt-1">Træk leads mellem faser for at opdatere status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <div><div className="text-xs text-slate-500 leading-none">Pipeline</div><div className="font-bold text-slate-900 text-sm mt-0.5">{formatDKK(pipelineValue)}</div></div>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <div><div className="text-xs text-slate-500 leading-none">Vundet ({wonCount})</div><div className="font-bold text-emerald-600 text-sm mt-0.5">{formatDKK(totalValue)}</div></div>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Lead</Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.key);
            const stageValue = stageLeads.reduce((s, l) => s + (l.estimated_value || 0), 0);
            return (
              <div key={stage.key} className={`flex flex-col rounded-xl border-2 border-t-4 ${stage.accent} border-slate-200 bg-slate-50/50 min-w-[260px] flex-1 max-w-[300px]`}>
                {/* Column header */}
                <div className="p-3 flex items-center justify-between sticky top-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`}></span>
                    <span className="font-semibold text-sm text-slate-700">{stage.key}</span>
                  </div>
                  <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${stage.header}`}>{stageLeads.length}</span>
                </div>
                <div className="px-3 pb-2 text-xs text-slate-400 font-medium">{formatDKK(stageValue)}</div>

                {/* Droppable area */}
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`flex-1 px-2 pb-2 space-y-2 overflow-y-auto rounded-b-xl transition-colors ${snapshot.isDraggingOver ? 'bg-amber-50' : ''}`}>
                      {stageLeads.map((lead, idx) => {
                        const SrcIcon = SOURCE_ICON[lead.source] || Mail;
                        return (
                          <Draggable key={lead.id} draggableId={lead.id} index={idx}>
                            {(p, snap) => (
                              <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                                className={`bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing ${snap.isDragging ? 'shadow-lg ring-2 ring-amber-300 rotate-1 scale-105' : 'hover:shadow-md'} transition-all`}>
                                <div className="flex items-start justify-between gap-1">
                                  <div className="font-semibold text-slate-900 text-sm leading-tight">{lead.name}</div>
                                  {lead.estimated_value > 0 && (
                                    <span className="text-sm font-bold text-slate-700 shrink-0">{formatDKK(lead.estimated_value)}</span>
                                  )}
                                </div>
                                {lead.customer_name && (
                                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><User className="w-3 h-3" /> {lead.customer_name}</div>
                                )}
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                                    <SrcIcon className="w-3 h-3" /> {lead.source}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{lead.project_type}</span>
                                </div>
                                {lead.assigned_to && (
                                  <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1"><User className="w-3 h-3" /> {lead.assigned_to}</div>
                                )}
                                {lead.due_date && (
                                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(lead.due_date)}</div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {stageLeads.length === 0 && (
                        <p className="text-xs text-slate-300 text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">Træk leads her</p>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nyt lead</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Lead-navn *</Label><Input value={form.name} onChange={set('name')} placeholder="F.eks. Ny parkeringsplads" /></div>
            <div className="space-y-1.5"><Label>Kunde</Label><Input value={form.customer_name} onChange={set('customer_name')} /></div>
            <div className="space-y-1.5"><Label>Telefon</Label><Input value={form.customer_phone} onChange={set('customer_phone')} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={form.customer_email} onChange={set('customer_email')} /></div>
            <div className="space-y-1.5"><Label>Estimeret værdi (DKK)</Label><Input type="number" value={form.estimated_value} onChange={set('estimated_value')} /></div>
            <div className="space-y-1.5"><Label>Kilde</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Projekttype</Label>
              <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Ansvarlig</Label><Input value={form.assigned_to} onChange={set('assigned_to')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={set('description')} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Gemmer...' : 'Opret lead'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}