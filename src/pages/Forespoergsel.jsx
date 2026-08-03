import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatDKK, calcSubtotal, calcVAT, calcTotal } from '@/lib/format';
import ForsideLayout from '@/components/forside/ForsideLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2, CheckCircle2, ArrowLeft, FileText, Mail, Clock, ShieldCheck } from 'lucide-react';

const PROJECT_TYPES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Malerarbejde', 'Tømrer', 'VVS', 'Elektriker', 'Totalentreprise', 'Andet'];

export default function Forespoergsel() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  // Byg linjeelementer + totaler ud fra enten AI-estimat eller manuelle items
  const lineItems = (() => {
    if (state.estimate?.line_items?.length) {
      return state.estimate.line_items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity) || 0,
        unit: i.unit || 'stk',
        unit_price: Number(i.unit_price) || 0,
        line_total: Number(i.line_total || (Number(i.quantity) || 0) * (Number(i.unit_price) || 0)),
      }));
    }
    if (state.items?.length) {
      return state.items.map((i) => ({
        description: i.name,
        quantity: Number(i.quantity) || 0,
        unit: i.unit || 'stk',
        unit_price: Number(i.price || i.unit_price) || 0,
        line_total: (Number(i.quantity) || 0) * (Number(i.price || i.unit_price) || 0),
      }));
    }
    return null;
  })();

  const subtotal = state.estimate ? Number(state.estimate.subtotal) || calcSubtotal(lineItems) : calcSubtotal(lineItems);
  const vat = state.estimate ? Number(state.estimate.vat) || calcVAT(subtotal) : calcVAT(subtotal);
  const total = state.estimate ? Number(state.estimate.total) || calcTotal(lineItems) : calcTotal(lineItems);
  const source = state.source || (state.estimate ? 'AI tilbudschat' : 'Prisberegner');
  const requestSummary = state.estimate?.message || '';

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', project_type: 'Andet', description: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const field = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Ingen data → tilbage til prisberegner
  if (!lineItems && !sent) {
    return <Navigate to="/beregn-tilbud" replace />;
  }

  const submit = async () => {
    setError('');
    if (!form.name.trim()) { setError('Angiv venligst dit navn.'); return; }
    if (!form.email.trim()) { setError('Angiv venligst din email.'); return; }
    setSending(true);
    try {
      await base44.entities.WebsiteInquiry.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        project_type: form.project_type,
        description: form.description.trim(),
        request_summary: requestSummary,
        line_items: lineItems,
        estimated_budget: Math.round(subtotal),
        quote_total: Math.round(total),
        source,
        status: 'Ny',
        submitted_date: new Date().toISOString().split('T')[0],
      });
      setSent(true);
      setForm({ name: '', email: '', phone: '', address: '', project_type: 'Andet', description: '' });
    } catch (e) {
      setError('Der opstod en fejl ved afsendelse. Prøv igen eller ring til os.');
    }
    setSending(false);
  };

  return (
    <ForsideLayout>
      <section className="pt-32 pb-16 bg-slate-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition">
            <ArrowLeft className="w-4 h-4" /> Tilbage
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium mb-4">
              <FileText className="w-4 h-4" /> Forespørgsel
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Send din forespørgsel</h1>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              Udfyld dine oplysninger, så udarbejder vi et endeligt og bindende tilbud og sender det til dig på mail inden for 24 timer.
            </p>
          </div>

          {sent ? (
            <div className="max-w-lg mx-auto bg-slate-950 rounded-2xl p-8 text-center border border-slate-800">
              <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Tak for din forespørgsel!</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Vi har modtaget dine oplysninger og dit vejledende tilbud. Du modtager dit endelige tilbud på mail inden for 24 timer.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/" className="inline-flex items-center justify-center gap-2 bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-semibold hover:bg-amber-300 transition text-sm">Til forsiden</Link>
                <Link to="/beregn-tilbud" className="inline-flex items-center justify-center gap-2 border border-slate-700 text-slate-200 px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition text-sm">Beregn ny pris</Link>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Tilbudsoversigt */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 lg:sticky lg:top-24">
                  <div className="flex items-center gap-2 mb-5">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <h3 className="font-semibold text-lg">Dit vejledende tilbud</h3>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
                    {lineItems.map((item, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-200">{item.description}</div>
                          <div className="text-xs text-slate-500">{item.quantity} {item.unit} × {formatDKK(item.unit_price)}</div>
                        </div>
                        <div className="font-medium text-right">{formatDKK(item.line_total)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-slate-300"><span>Subtotal ekskl. moms</span><span>{formatDKK(subtotal)}</span></div>
                    <div className="flex justify-between text-sm text-slate-300"><span>Moms (25%)</span><span>{formatDKK(vat)}</span></div>
                    <div className="flex justify-between text-xl font-bold pt-3 border-t border-slate-700"><span>Total</span><span className="text-amber-400">{formatDKK(total)}</span></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                    Prisen er vejledende. Vi bekræfter det endelige tilbud på mail inden for 24 timer.
                  </p>
                </div>
              </div>

              {/* Formular */}
              <div className="lg:col-span-3 order-1 lg:order-2">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Dine oplysninger</h3>
                  <p className="text-sm text-slate-500 mb-6">Udfyld nedenstående, så vi kan sende dig tilbuddet.</p>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Navn *</label>
                        <input value={form.name} onChange={(e) => field('name', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Dit navn" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Email *</label>
                        <input type="email" value={form.email} onChange={(e) => field('email', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="din@email.dk" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Telefon</label>
                        <input value={form.phone} onChange={(e) => field('phone', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="+45 00 00 00 00" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Opgavetype</label>
                        <Select value={form.project_type} onValueChange={(v) => field('project_type', v)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>{PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Adresse</label>
                      <input value={form.address} onChange={(e) => field('address', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Hvor skal opgaven udføres?" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Bemærkninger</label>
                      <textarea value={form.description} onChange={(e) => field('description', e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" placeholder="Evt. supplerende oplysninger til din opgave..." />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button onClick={submit} disabled={sending} className="w-full inline-flex items-center justify-center gap-2 bg-amber-400 text-slate-950 px-6 py-3.5 rounded-xl font-semibold hover:bg-amber-300 transition disabled:opacity-50">
                      {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sender...</> : <><Send className="w-4 h-4" /> Send forespørgsel</>}
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2 text-xs text-slate-500"><Mail className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /><span>Du modtager tilbuddet på mail inden for 24 timer.</span></div>
                    <div className="flex items-start gap-2 text-xs text-slate-500"><Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /><span>Vi bekræfter det endelige, bindende tilbud.</span></div>
                    <div className="flex items-start gap-2 text-xs text-slate-500"><ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /><span>Uforpligtende — du binder dig ikke ved at sende.</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </ForsideLayout>
  );
}