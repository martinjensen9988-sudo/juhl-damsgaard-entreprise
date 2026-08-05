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
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lineItems, setLineItems] = useState([]);
  const [cleanedNotes, setCleanedNotes] = useState('');
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
      const prompt = `Du er prisberegner for Juhl & Damsgaard Entreprise. Lav et vejledende tilbud med linjeelementer${
        notes ? ` baseret på denne beskrivelse: "${notes}"` : ' baseret på billederne fra byggepladsen'
      }.

Vejledende priser (ekskl. moms):
- Væg-/loftmaling (incl. grund og spartling efter behov): 75 kr/m²
- Facademaling: 95 kr/m² · Maling af træværk/vinduer: 120 kr/m² · Tapetopsætning: 85 kr/m² · Spartling/slibning: 60 kr/m² · Grundmaling: 25 kr/m²
- Maling materiale (væg-/loftmaling): 145 kr/liter · Facademaling: 175 kr/liter · Træmaling/lak: 195 kr/liter · Grundmaling: 95 kr/liter
- Tømrer: 495 kr/time · Gipsvæg: 245 kr/m² · Beklædning træ: 295 kr/m² · Dørmontage: 1250 kr/stk · Vindueskift: 1850 kr/stk · Gulvlægning trægulv: 245 kr/m²
- VVS: 695 kr/time · Håndvask: 1850 kr/stk · Toilet: 2200 kr/stk · Badeværelsesrenovering komplet: 1850 kr/m²
- Elektriker: 595 kr/time · Stikkontakt/afbryder: 450 kr/stk · Armatur: 750 kr/stk · Eltavle: 6500 kr/stk
- Gravearbejde: 580 kr/m³ · Grøftegravning: 320 kr/m · Afgravning: 145 kr/m³ · Nedrivning: 450 kr/m² · Kloakrør Ø300: 850 kr/m · Kloakbrønd: 4500 kr/stk · Asfaltering: 395 kr/m² · Betonfundament: 850 kr/m² · Beton støbning: 1150 kr/m³ · Transport: 3500 kr/fs · Maskinleje: 4500 kr/dag · Affaldsbortkørsel: 3500 kr/fs · Håndarbejde: 280 kr/time
- Teknisk isolering: Rørisolering (mineraluld) 145 kr/m · Beholderisolering 295 kr/m² · Ventilationsisolering 185 kr/m · Teknisk isolering (tag/væg) 245 kr/m² · Brandisolering 395 kr/m² · Armeringssokkel isolering 165 kr/m
- Slutrengøring/byggepladsrengøring: 75 kr/m² · Glarmester (vinduespolering): 45 kr/m²

Forbrugsmaterialer (skal altid medtages som separate linjer, når de er nødvendige for opgaven):
- Maling: ca. 1 liter / 10 m² per strøg. Standard: 2 strøg → 1 liter / 5 m². Priser: væg-/loftmaling 145 kr/liter · facademaling 175 kr/liter · træmaling/lak 195 kr/liter · grundmaling 95 kr/liter
- Spartlemasse: 25 kr/kg · ca. 0,5 kg/m² ved behov · Fuge/akryl: 75 kr/patron · 1 patron pr. 8 m²
- Gipsplader: 45 kr/m² · Gipsskruer/bånd: 12 kr/m² · Vævpapir: 8 kr/m²
- Træbeklædning materiale: 165 kr/m² · Impregneret træ: 195 kr/m² · Dørgulv/træplanker: 245 kr/m²
- Fliser: 195 kr/m² · Fliseklæber: 45 kr/m² · Fuge: 25 kr/m² · Membran (vådrum): 95 kr/m²
- VVS-materiale (rør, fittings, samlinger): 350 kr/sæt · Slange/afløb: 95 kr/stk
- El-materiale (kabler, klemmer, beslag): 12 kr/m kabel · Kabelkanal: 35 kr/m
- Betonmateriale (cement, grus, armering): 450 kr/m³ · Kloakgrus: 145 kr/ton · Støbeform: 95 kr/m²
- Tapet: 75 kr/rulle · ca. 1 rulle pr. 5 m² · Tapetklister: 45 kg/rulle
- Gulv materiale: Trægulv 245 kr/m² · Vinyl/klik-gulv 175 kr/m² · Gulvafslibning papir: 35 kr/m²
- Isoleringsmateriale (hovedmateriale): Mineraluld batts/matter 85 kr/m² · EPS/XPS skum 110 kr/m² · Glasuld 75 kr/m² · Cellulose 65 kr/m²
- Isoleringsmateriale (tilbehør): Dampspærre folie 25 kr/m² · Tape 12 kr/m · Klemmer/beslag 8 kr/stk · Afdækningsfolie 15 kr/m²

Regler:
- ENHED: Hver linje SKAL have en korrekt enhed (m², m³, m, stk, time, liter, dag, fs, sæt, rulle). Aldrig tom enhed. Brug den enhed der passer til opgaven (væg = m², rør = m, beton = m³, maling = liter).
- MINIMUM ANTAL LINJER: Et tilbud må ALDRIG have kun én linje. Hver opgave skal have mindst 2-3 linjer: (1) selve arbejdet/ydelsen, (2) hovedmaterialet, (3) tilbehørsmateriale. Hvis tilbuddet kun har 1 linje er det FEJL – tilføj altid materialelinjer.
- VIGTIGT: Hver eneste opgave kunden nævner SKAL have mindst én arbejdslinje i tilbuddet. Glem aldrig en nævnt opgave (f.eks. hvis kunden skriver "maling" skal der altid være en male-linje; "rengøring" → slutrengørings-linje; "isolering" → isolerings-linje; både maling og isolering → én linje for hver).
- ISOLERING KLASSEFICERES SOM TEKNISK ISOLERING (ikke tømrer): Når kunden nævner "isolering", "krybekælder", "kælder", "loft", "væg", "tag", "rør" el. lign. – brug Teknisk isolering-priserne (245 kr/m² for tag/væg-flader, 145 kr/m for rør, 185 kr/m ventilation, 395 kr/m² brand). Brug ALDRIG tømmerprisen 495 kr/time til isoleringsopgaver. Tilføj også: (a) hovedmateriale mineraluld/EPS ca. 85-110 kr/m², (b) dampspærre folie 25 kr/m², (c) tape/klemmer ca. 35 kr/m².
- Vælg KUN de prislinjer der hører til de fag kunden beskriver (ved maling: kun maling/spartling/grundmaling/tapet – ingen gravemaskine, transport eller affald; ved teknisk isolering: kun isoleringslinjer + isoleringsmateriale).
- Estimer mængder rimeligt ud fra beskrivelsen (f.eks. maling af 53 m² lejlighed: beregn væg- og loftflade typisk som 53 m² etagemål × ca. 3 = ca. 160 m² maleflade, opdelt i væg- og loftmaling).
- VIGTIGT – FORBRUGSMATERIALER: For hver arbejdsopgave skal du altid vurdere og tilføje nødvendige forbrugsmaterialer som separate linjer. Glem aldrig materialer – det sikrer at alle omkostninger er dækket.
  • Malearbejde → maling (beregn liter: maleflade ÷ 5 for 2 strøg) + spartlemasse hvis nævnt + pensler/ruller (1 sæt pr. 50 m²)
  • Flisearbejde → fliser + fliseklæber + fuge + membran hvis vådrum
  • Tømrer/gips → gipsplader + skruer/bånd, eller træmateriale + beslag
  • Beton/støbning → cement/grus/armering + støbeform
  • Kloak → kloakgrus + rør/beslag
  • VVS → rør/fittings/samlinger + slange/afløb
  • El → kabler + klemmer + kabelkanal
  • Gulv → gulvmateriale + underlag/afslibning
  • Tapet → tapetruller + klister
  • Teknisk isolering → 3 linjer: (1) isoleringsarbejde 245 kr/m², (2) mineraluld/EPS hovedmateriale 85-110 kr/m², (3) dampspærre folie 25 kr/m² + tape/klemmer 35 kr/m². Ved rørisolering: arbejdslinje 145 kr/m + isoleringsmateriale 85 kr/m + tape 25 kr/m.
  • Generelt: pensler, ruller, slibepapir, afdækningsfolie, maskeringstape (1 sæt 75 kr pr. 50 m²)
  - Ved malearbejde: beregn altid maltforbrug og tilføj en separat materialelinje for maling. Forbrug: ca. 1 liter dækker 10 m² med 1 strøg – de fleste opgaver kræver 2 strøg, så divider maleflade med 5 for at få literantal (f.eks. 160 m² ÷ 5 = 32 liter). Brug korrekt malttype ud fra opgaven (væg-/loftmaling, facademaling, træmaling el. grundmaling) med tilhørende literpris. Angiv unit "liter" og antal liter som quantity.
  - TJEKLISTE FØR SVAR: (1) Har tilbuddet mindst 2 linjer? (2) Har hver arbejdsopgave en tilhørende materialelinje? (3) Er isolering klassificeret som teknisk isolering (ikke tømrer)? Hvis nej – ret og tilføj linjer før du returnerer.
- Alle priser er ekskl. moms.
- Hver linje: description, quantity, unit (stk, m², m³, time, m, fs, dag, sæt), unit_price.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: images.length > 0 ? images : undefined,
        response_json_schema: {
          type: 'object',
          properties: {
            cleaned_notes: { type: 'string', description: 'Den rettede og professionelt formulerede opgavebeskrivelse på korrekt dansk, uden stavefejl' },
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
      setCleanedNotes(result.cleaned_notes || notes);
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
        valid_until: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        line_items: lineItems,
        notes: cleanedNotes || notes || '',
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
          <Label>Udløbsdato (gyldig til)</Label>
          <Input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            placeholder="Vælg dato"
          />
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

          <LineItemEditor items={lineItems} onChange={setLineItems} />

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