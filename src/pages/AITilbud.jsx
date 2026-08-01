import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sparkles, Upload, X, Image as ImageIcon, FileCheck2 } from 'lucide-react';
import LineItemEditor from '@/components/LineItemEditor';
import { formatDKK, calcSubtotal, calcVAT, calcTotal } from '@/lib/format';

const genQuoteNumber = (existing) => {
  const year = new Date().getFullYear();
  const prefix = `TIL-${year}-`;
  const nums = existing
    .filter((q) => q.quote_number?.startsWith(prefix))
    .map((q) => parseInt(q.quote_number.replace(prefix, ''), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
};

export default function AITilbud() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lineItems, setLineItems] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, p, q] = await Promise.all([
          base44.entities.Customer.list('-created_date', 200),
          base44.entities.Project.list('-created_date', 200),
          base44.entities.Quote.list('-created_date', 200),
        ]);
        setCustomers(c);
        setProjects(p);
        setQuotes(q);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const customer = customers.find((c) => c.id === customerId);
  const availableProjects = customerId ? projects.filter((p) => p.customer_id === customerId) : projects;

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const res = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(res.file_url);
      }
      setImages([...images, ...uploaded]);
    } catch (e) {
      console.error(e);
      alert('Kunne ikke uploade billeder');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => setImages(images.filter((_, i) => i !== idx));

  const generate = async () => {
    if (!notes.trim() && images.length === 0) return;
    setGenerating(true);
    try {
      const prompt = `Du er en erfaren dansk entreprenør. Lav en professionel tilbudsliste med linjeelementer${
        notes ? ` baseret på denne beskrivelse: "${notes}"` : ' baseret på billederne fra byggepladsen'
      }. Brug realistiske danske entreprenørpriser for materialer og arbejde. Hver linje skal have: description (hvad der skal laves), quantity (antal), unit (enhed: stk, m², m³, time, m, fs, dag, sæt), unit_price (pris i DKK). Vær grundig og dæk alle arbejdsopgaver.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: images.length > 0 ? images : undefined,
        response_json_schema: {
          type: 'object',
          properties: {
            line_items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                  unit_price: { type: 'number' },
                },
              },
            },
          },
        },
      });

      const items = (result.line_items || []).map((item) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unit: item.unit || 'stk',
        unit_price: item.unit_price || 0,
      }));
      setLineItems(items);
      setGenerated(true);
    } catch (e) {
      console.error(e);
      alert('Kunne ikke generere tilbud. Prøv igen.');
    } finally {
      setGenerating(false);
    }
  };

  const createQuote = async () => {
    if (!customerId || lineItems.length === 0) return;
    setSaving(true);
    try {
      const project = projects.find((p) => p.id === projectId);
      const quoteNumber = genQuoteNumber(quotes);
      await base44.entities.Quote.create({
        quote_number: quoteNumber,
        customer_id: customerId,
        customer_name: customer?.name || customer?.company || '',
        customer_email: customer?.email || '',
        project_id: projectId || '',
        project_name: project?.name || '',
        status: 'Kladde',
        date: new Date().toISOString().slice(0, 10),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        line_items: lineItems,
        notes: notes || '',
      });
      navigate('/tilbud');
    } catch (e) {
      console.error(e);
      alert('Kunne ikke oprette tilbud');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">AI Tilbudsgenerator</h1>
        <p className="text-slate-500 mt-1">Indtast noter eller upload billeder fra byggepladsen – AI'en genererer et professionelt tilbudsudkast</p>
      </div>

      {/* Input section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-slate-900">Beskriv opgaven</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Kunde *</Label>
            <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setProjectId(''); }}>
              <SelectTrigger><SelectValue placeholder="Vælg kunde" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Projekt (valgfrit)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
              <SelectContent>
                {availableProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Noter / Opgavebeskrivelse</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Beskriv opgaven detaljeret... F.eks. 'Badeværelse 8 m², fuld renovering. Eksisterende fliser og inventar skal nedbrydes. Ny membrane, vådrumspanel, fliser på gulv og væg, installation af brusekabine, håndvask og toilet.'"
          />
        </div>

        {/* Image upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> Billeder fra byggepladsen (valgfrit)</Label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg py-6 cursor-pointer hover:border-slate-300 transition-colors">
            <Upload className="w-6 h-6 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">{uploading ? 'Uploader...' : 'Klik for at uploade billeder'}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(Array.from(e.target.files))}
              disabled={uploading}
            />
          </label>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={generate}
          disabled={generating || (!notes.trim() && images.length === 0)}
          className="w-full bg-slate-950 hover:bg-slate-800"
        >
          <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" /> {generating ? 'AI\'en genererer tilbud...' : 'Generer tilbudsudkast med AI'}
        </Button>
      </div>

      {/* Generated quote */}
      {generated && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-500" />
              <h2 className="font-semibold text-slate-900">Genereret tilbudsudkast</h2>
            </div>
            <span className="text-sm text-slate-400">Total: {formatDKK(calcTotal(lineItems))}</span>
          </div>

          <LineItemEditor value={lineItems} onChange={setLineItems} />

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span><span>{formatDKK(calcSubtotal(lineItems))}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Moms (25%)</span><span>{formatDKK(calcVAT(calcSubtotal(lineItems)))}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total</span><span>{formatDKK(calcTotal(lineItems))}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGenerated(false)} className="flex-1">Start forfra</Button>
            <Button
              onClick={createQuote}
              disabled={saving || !customerId || lineItems.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? 'Opretter...' : 'Opret tilbud'}
            </Button>
          </div>
          {!customerId && <p className="text-xs text-slate-400 text-center">Vælg en kunde for at oprette tilbuddet</p>}
        </div>
      )}
    </div>
  );
}