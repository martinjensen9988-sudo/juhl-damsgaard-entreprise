import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
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
import LineItemEditor from '@/components/LineItemEditor';
import { generateQuotePDF } from '@/lib/quotePdf';
import { formatDKK, calcSubtotal, calcVAT, calcTotal, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, FileText, ArrowRight, Sparkles, ExternalLink, Download } from 'lucide-react';

const STATUSES = ['Kladde', 'Sendt', 'Accepteret', 'Afvist', 'Udløbet'];

const STATUS_BADGE = {
  Kladde: 'bg-slate-100 text-slate-500',
  Sendt: 'bg-blue-100 text-blue-700',
  Accepteret: 'bg-emerald-100 text-emerald-700',
  Afvist: 'bg-red-100 text-red-700',
  Udløbet: 'bg-slate-200 text-slate-600',
};

function nextNumber(prefix, existing) {
  const year = new Date().getFullYear();
  const nums = existing
    .map((x) => x)
    .filter((x) => x && x.startsWith(`${prefix}-${year}`))
    .map((x) => parseInt(x.split('-').pop(), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
}

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [company, setCompany] = useState({});
  const [pdfLoading, setPdfLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [q, c, p, cs] = await Promise.all([
        base44.entities.Quote.list('-created_date', 100),
        base44.entities.Customer.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 200),
        base44.entities.CompanySettings.list('-created_date', 10),
      ]);
      setQuotes(q);
      setCustomers(c);
      setProjects(p);
      setCompany(cs[0] || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const blankForm = () => ({
    quote_number: nextNumber('TIL', quotes.map((q) => q.quote_number)),
    customer_id: '',
    customer_name: '',
    project_id: '',
    project_name: '',
    status: 'Kladde',
    date: new Date().toISOString().slice(0, 10),
    valid_until: '',
    line_items: [{ description: '', quantity: 1, unit: 'stk', unit_price: 0 }],
    notes: '',
  });

  const openNew = () => {
    setForm(blankForm());
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (q) => {
    setForm({ ...q, line_items: q.line_items || [] });
    setEditing(q);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const customer = customers.find((c) => c.id === form.customer_id);
      const project = projects.find((p) => p.id === form.project_id);
      const payload = {
        ...form,
        customer_name: customer ? customer.company || customer.name : '',
        customer_email: customer ? customer.email : '',
        project_name: project ? project.name : '',
      };
      if (editing) {
        await base44.entities.Quote.update(editing.id, payload);
      } else {
        await base44.entities.Quote.create(payload);
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
    if (!confirm('Slet dette tilbud?')) return;
    await base44.entities.Quote.delete(id);
    load();
  };

  const convertToInvoice = async (q) => {
    const invNumber = nextNumber('FAK', quotes);
    const payload = {
      invoice_number: invNumber,
      customer_id: q.customer_id || '',
      customer_name: q.customer_name || '',
      project_id: q.project_id || '',
      project_name: q.project_name || '',
      quote_id: q.id,
      status: 'Kladde',
      date: new Date().toISOString().slice(0, 10),
      due_date: '',
      line_items: q.line_items || [],
      paid_amount: 0,
      notes: q.notes || '',
    };
    await base44.entities.Invoice.create(payload);
    await base44.entities.Quote.update(q.id, { status: 'Accepteret' });
    load();
    alert(`Tilbud konverteret til faktura ${invNumber}`);
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Du er en dansk entreprenør. Lav en professionel tilbudsliste med linjeelementer baseret på denne opgavebeskrivelse: "${aiPrompt}". Brug realistiske danske priser for materialer og arbejde. Hver linje skal have: description (hvad der skal laves), quantity (antal), unit (enhed: stk, m², m³, time, m, fs, dag), unit_price (pris i DKK).`,
        response_json_schema: {
          type: "object",
          properties: {
            line_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unit: { type: "string" },
                  unit_price: { type: "number" }
                }
              }
            }
          }
        }
      });
      const newItems = (result.line_items || []).map(item => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unit: item.unit || 'stk',
        unit_price: item.unit_price || 0,
      }));
      setForm({ ...form, line_items: [...(form.line_items || []), ...newItems] });
      setAiOpen(false);
      setAiPrompt('');
    } catch (e) {
      console.error(e);
      alert('Kunne ikke generere tilbud. Prøv igen.');
    } finally {
      setAiLoading(false);
    }
  };

  const sendLink = (q) => {
    const url = `${window.location.origin}/portal/tilbud/${q.id}`;
    navigator.clipboard.writeText(url).then(() => alert('Link kopieret:\n' + url));
  };

  const downloadPDF = async (q) => {
    setPdfLoading(q.id);
    try {
      generateQuotePDF(q, company);
    } catch (e) {
      console.error(e);
      alert('Kunne ikke generere PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Tilbud</h1>
          <p className="text-slate-500 mt-1">Opret og send tilbud til dine kunder</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800" disabled={!form && quotes.length > 0 ? false : false}>
          <Plus className="w-4 h-4 mr-1.5" /> Nyt tilbud
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen tilbud endnu. Opret dit første tilbud.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Tilbudsnr.</th>
                  <th className="px-4 py-3">Kunde</th>
                  <th className="px-4 py-3">Dato</th>
                  <th className="px-4 py-3 text-right">Beløb</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Handlinger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{q.quote_number}</td>
                    <td className="px-4 py-3 text-slate-600">{q.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(q.date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatDKK(calcTotal(q.line_items))}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[q.status] || 'bg-slate-100 text-slate-500'}`}>
                        {q.status}
                      </span>
                      {q.viewed_at && (
                        <span className="block text-xs text-blue-500 mt-1">Set {formatDate(q.viewed_at.slice(0, 10))}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {q.status !== 'Accepteret' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => convertToInvoice(q)}
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Konverter til faktura"
                          >
                            <ArrowRight className="w-4 h-4 mr-1" /> Faktura
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadPDF(q)}
                          disabled={pdfLoading === q.id}
                          title="Download PDF"
                        >
                          {pdfLoading === q.id ? (
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 text-slate-700" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => sendLink(q)}
                          title="Kopiér kundelink"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(q.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {form && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Rediger tilbud' : 'Nyt tilbud'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Tilbudsnr.</Label>
                  <Input value={form.quote_number} onChange={set('quote_number')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dato</Label>
                  <Input type="date" value={form.date || ''} onChange={set('date')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gyldig til</Label>
                  <Input type="date" value={form.valid_until || ''} onChange={set('valid_until')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kunde</Label>
                  <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Vælg kunde" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Projekt</Label>
                  <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Linjer</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAiOpen(true)}>
                    <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" /> AI Hjælp
                  </Button>
                </div>
                <LineItemEditor
                  items={form.line_items}
                  onChange={(items) => setForm({ ...form, line_items: items })}
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatDKK(calcSubtotal(form.line_items))}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Moms (25%)</span>
                  <span>{formatDKK(calcVAT(calcSubtotal(form.line_items)))}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatDKK(calcTotal(form.line_items))}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Bemærkninger</Label>
                <Textarea value={form.notes || ''} onChange={set('notes')} rows={2} placeholder="Betingelser, bemærkninger mm." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
              <Button onClick={save} disabled={saving || !form.quote_number}>
                {saving ? 'Gemmer...' : 'Gem tilbud'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> AI Tilbudsassistent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500">
              Beskriv opgaven, så genererer AI'en forslag til linjeelementer med danske priser. Du kan herefter tilpasse linjerne manuelt.
            </p>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={5}
              placeholder="F.eks. Badeværelse renovering 8 m². Nedbrydning af eksisterende vådrum, ny membrane, fliser på gulv og væg, installation af brusekabine, vask og toilet."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiOpen(false)}>Annuller</Button>
            <Button onClick={generateWithAI} disabled={aiLoading || !aiPrompt.trim()}>
              <Sparkles className="w-4 h-4 mr-1.5" /> {aiLoading ? 'Genererer...' : 'Generer linjer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}