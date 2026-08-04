import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image as Img } from '@/components/ui/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatDKK, calcSubtotal, calcVAT, calcTotal, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';
import { HardHat, Camera, Calculator, Plus, Trash2, FileText, Receipt, Check, ArrowUpRight } from 'lucide-react';

const SERVICES = [
  { name: 'Gravearbejde', unit: 'm³', price: 580 },
  { name: 'Kloakrør lægning', unit: 'm', price: 850 },
  { name: 'Asfaltering', unit: 'm²', price: 395 },
  { name: 'Betonfundament', unit: 'm²', price: 850 },
  { name: 'Kantsten opsætning', unit: 'm', price: 185 },
  { name: 'Nedbrydning af belægning', unit: 'm', price: 250 },
  { name: 'Nedrivning', unit: 'm²', price: 450 },
  { name: 'Transport (materiale)', unit: 'fs', price: 3500 },
  { name: 'Maskinleje (gravemaskine)', unit: 'dag', price: 4500 },
  { name: 'Håndarbejde', unit: 'time', price: 395 },
];

export default function CustomerPortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [images, setImages] = useState({});
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  const acceptQuote = async (q) => {
    setAcceptingId(q.id);
    try {
      const res = await base44.functions.invoke('quoteAction', { quote_id: q.id, action: 'accept' });
      if (res.data?.status) {
        setQuotes((prev) => prev.map((x) => (x.id === q.id ? { ...x, status: res.data.status } : x)));
        toast({ title: 'Tilbud accepteret', description: 'Vi kontakter dig hurtigst muligt.' });
      } else if (res.data?.error) {
        toast({ title: 'Fejl', description: res.data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Kunne ikke acceptere tilbud', variant: 'destructive' });
    } finally {
      setAcceptingId(null);
    }
  };

  // Calculator state
  const [calcItems, setCalcItems] = useState([
    { name: 'Asfaltering', unit: 'm²', unit_price: 395, quantity: 100 },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const [p, q, i] = await Promise.all([
          base44.entities.Project.list('-created_date', 50),
          base44.entities.Quote.list('-created_date', 50),
          base44.entities.Invoice.list('-created_date', 50),
        ]);
        setProjects(p);
        setQuotes(q);
        setInvoices(i);
        // Load images for each project
        const imgMap = {};
        for (const proj of p) {
          try {
            const imgs = await base44.entities.ProjectImage.filter({ project_id: proj.id }, '-upload_date', 50);
            imgMap[proj.id] = imgs;
          } catch {
            imgMap[proj.id] = [];
          }
        }
        setImages(imgMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Calculator helpers
  const addCalcItem = () => {
    const svc = SERVICES[0];
    setCalcItems([...calcItems, { name: svc.name, unit: svc.unit, unit_price: svc.price, quantity: 1 }]);
  };
  const removeCalcItem = (i) => setCalcItems(calcItems.filter((_, idx) => idx !== i));
  const updateCalcItem = (i, field, value) => {
    const next = [...calcItems];
    next[i] = { ...next[i], [field]: value };
    setCalcItems(next);
  };
  const addService = (svc) => {
    setCalcItems([...calcItems, { name: svc.name, unit: svc.unit, unit_price: svc.price, quantity: 1 }]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Velkommen{user?.full_name ? `, ${user.full_name}` : ''}
        </h1>
        <p className="text-slate-500 mt-1">Følg med i dine projekter og beregn priser</p>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects"><HardHat className="w-4 h-4 mr-1.5" /> Mine Projekter</TabsTrigger>
          <TabsTrigger value="calc"><Calculator className="w-4 h-4 mr-1.5" /> Prisberegner</TabsTrigger>
          <TabsTrigger value="quotes"><FileText className="w-4 h-4 mr-1.5" /> Tilbud</TabsTrigger>
          <TabsTrigger value="invoices"><Receipt className="w-4 h-4 mr-1.5" /> Fakturaer</TabsTrigger>
        </TabsList>

        {/* Projects tab */}
        <TabsContent value="projects" className="mt-4 space-y-4">
          {projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <HardHat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Du har ingen projekter endnu.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map((p) => {
                const imgs = images[p.id] || [];
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-sm text-slate-500">{p.type}</div>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'I gang' ? 'bg-blue-100 text-blue-700' :
                          p.status === 'Afsluttet' ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'Planlægning' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      {p.description && <p className="text-sm text-slate-600 mb-3">{p.description}</p>}
                      <div className="text-xs text-slate-500 space-y-1">
                        {p.start_date && (
                          <div>Periode: {formatDate(p.start_date)} → {formatDate(p.end_date)}</div>
                        )}
                        {p.address && <div>Adresse: {p.address}</div>}
                      </div>
                    </div>
                    {/* Image gallery preview */}
                    <div className="border-t border-slate-100 px-5 py-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
                        <Camera className="w-4 h-4 text-slate-400" />
                        Fremskridtsbilleder ({imgs.length})
                      </div>
                      {imgs.length === 0 ? (
                        <p className="text-xs text-slate-400">Ingen billeder endnu.</p>
                      ) : (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {imgs.map((img) => (
                            <div key={img.id} className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden border border-slate-200">
                              <Img src={img.image_url} className="w-full h-full" fittingType="fill" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Calculator tab */}
        <TabsContent value="calc" className="mt-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Service picker */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Vælg ydelse</h3>
              <div className="space-y-2">
                {SERVICES.map((svc) => (
                  <button
                    key={svc.name}
                    onClick={() => addService(svc)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">{svc.name}</div>
                      <div className="text-xs text-slate-500">per {svc.unit}</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">{formatDKK(svc.price)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculator */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Prisberegner</h3>
              <div className="space-y-2">
                {calcItems.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Tilføj ydelser fra venstre for at beregne pris.</p>
                )}
                {calcItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        value={item.name}
                        onChange={(e) => updateCalcItem(i, 'name', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateCalcItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                        className="text-sm text-right"
                        placeholder="Antal"
                      />
                    </div>
                    <div className="col-span-1 text-center text-xs text-slate-500">{item.unit}</div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateCalcItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="text-sm text-right"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => removeCalcItem(i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={addCalcItem}>
                <Plus className="w-4 h-4 mr-1.5" /> Tilføj linje
              </Button>

              {calcItems.length > 0 && (
                <div className="mt-4 bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatDKK(calcSubtotal(calcItems))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Moms (25%)</span>
                    <span>{formatDKK(calcVAT(calcSubtotal(calcItems)))}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>{formatDKK(calcTotal(calcItems))}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-3">
                Dette er et uforpligtende overslag. Kontakt os for et endeligt tilbud.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Quotes tab */}
        <TabsContent value="quotes" className="mt-4">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Ingen tilbud tilgængelige.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Tilbudsnr.</th>
                    <th className="px-4 py-3">Dato</th>
                    <th className="px-4 py-3 text-right">Beløb</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link to={`/portal/tilbud/${q.id}`} className="hover:text-amber-600 inline-flex items-center gap-1">
                          {q.quote_number} <ArrowUpRight className="w-3 h-3 opacity-50" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(q.date)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{formatDKK(calcTotal(q.line_items))}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          q.status === 'Accepteret' ? 'bg-emerald-100 text-emerald-700' :
                          q.status === 'Sendt' ? 'bg-blue-100 text-blue-700' :
                          q.status === 'Afvist' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{q.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {q.status === 'Sendt' ? (
                          <Button
                            size="sm"
                            onClick={() => acceptQuote(q)}
                            disabled={acceptingId === q.id}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {acceptingId === q.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Acceptér
                          </Button>
                        ) : q.status === 'Accepteret' ? (
                          <span className="text-xs text-emerald-600 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Godkendt</span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/portal/tilbud/${q.id}`)}>Åbn</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Invoices tab */}
        <TabsContent value="invoices" className="mt-4">
          {invoices.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Ingen fakturaer tilgængelige.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Fakturanr.</th>
                    <th className="px-4 py-3">Dato</th>
                    <th className="px-4 py-3">Forfald</th>
                    <th className="px-4 py-3 text-right">Beløb</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.date)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{formatDKK(calcTotal(inv.line_items))}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === 'Betalt' ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'Forfalden' ? 'bg-red-100 text-red-700' :
                          inv.status === 'Sendt' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}