import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BRAND_PHONE_DISPLAY } from '@/lib/brand';

const empty = { name: '', email: '', phone: '', project_type: 'Andet', description: '', address: '' };

export default function ForsideKontaktForm() {
  const [form, setForm] = useState(empty);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email) { alert('Udfyld navn og email'); return; }
    setSending(true);
    try {
      await base44.entities.WebsiteInquiry.create({ ...form, source: 'Forside kontakt', status: 'Ny', submitted_date: new Date().toISOString().split('T')[0] });
      setSent(true);
      setForm(empty);
    } catch (e) {
      alert('Der opstod en fejl. Prøv igen eller ring til os.');
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="bg-slate-950 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white mb-1">Tak for din henvendelse!</h3>
        <p className="text-slate-400 text-sm">Vi vender tilbage inden for 24 timer.</p>
        <button onClick={() => setSent(false)} className="mt-4 text-sm text-amber-400 hover:text-amber-300">Send en ny besked</button>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 rounded-2xl p-6 md:p-8">
      <h3 className="text-xl font-bold text-white mb-1">Send os en besked</h3>
      <p className="text-slate-400 text-sm mb-6">Udfyld formularen, så vender vi tilbage hurtigst muligt.</p>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Navn *</label>
            <input value={form.name} onChange={(e) => field('name', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Dit navn" />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Email *</label>
            <input type="email" value={form.email} onChange={(e) => field('email', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="din@email.dk" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Telefon</label>
            <input value={form.phone} onChange={(e) => field('phone', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder={BRAND_PHONE_DISPLAY} />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Opgavetype</label>
            <Select value={form.project_type} onValueChange={(v) => field('project_type', v)}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Andet'].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-300 mb-1 block">Adresse</label>
          <input value={form.address} onChange={(e) => field('address', e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Hvor skal opgaven udføres?" />
        </div>
        <div>
          <label className="text-sm text-slate-300 mb-1 block">Beskriv din opgave</label>
          <textarea value={form.description} onChange={(e) => field('description', e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" placeholder="Beskriv hvad du skal have lavet..." />
        </div>
        <button onClick={submit} disabled={sending} className="w-full inline-flex items-center justify-center gap-2 bg-amber-400 text-slate-950 px-6 py-3.5 rounded-xl font-semibold hover:bg-amber-300 transition disabled:opacity-50">
          {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sender...</> : <><Send className="w-4 h-4" /> Send henvendelse</>}
        </button>
      </div>
    </div>
  );
}
