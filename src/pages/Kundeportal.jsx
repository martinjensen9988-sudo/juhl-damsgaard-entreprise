import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { HardHat, Images, Receipt, Building2, Clock, MapPin } from 'lucide-react';
import { Image } from '@/components/ui/image';

const STATUS_STYLE = {
  Planlægning: 'bg-slate-100 text-slate-700',
  'I gang': 'bg-blue-50 text-blue-700',
  Færdig: 'bg-emerald-50 text-emerald-700',
  Afsluttet: 'bg-slate-200 text-slate-600',
  'På hold': 'bg-amber-50 text-amber-700',
};
const INV_STYLE = { Sendt: 'bg-blue-50 text-blue-700', Betalt: 'bg-emerald-50 text-emerald-700', Forfalden: 'bg-red-50 text-red-700', Kladde: 'bg-slate-100 text-slate-700', Annulleret: 'bg-slate-100 text-slate-500' };

export default function Kundeportal() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const [p, inv, img] = await Promise.all([
          base44.entities.Project.list('-created_date', 100),
          base44.entities.Invoice.list('-date', 100),
          base44.entities.ProjectImage.list('-upload_date', 200),
        ]);
        setProjects(p);
        setInvoices(inv);
        setImages(img);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const lineTotal = (li) => (li.quantity || 0) * (li.unit_price || 0);
  const invTotal = (inv) => (inv.line_items || []).reduce((s, li) => s + lineTotal(li), 0);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-400 flex items-center justify-center"><Building2 className="w-5 h-5 text-slate-950" /></div>
          <div>
            <div className="font-bold tracking-tight">Juhl & Damsgaard Entreprise</div>
            <div className="text-xs text-slate-400">Kundeportal {user?.email ? `• ${user.email}` : ''}</div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <section>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Velkommen{user?.full_name ? `, ${user.full_name}` : ''}</h1>
          <p className="text-slate-500">Se fremdrift på dine projekter, billeder og fakturaer.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><HardHat className="w-4 h-4 text-amber-500" /> Dine projekter</h2>
          {projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-10 text-center text-slate-400">Ingen projekter fundet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[p.status] || 'bg-slate-100'}`}>{p.status}</span>
                  </div>
                  {p.description && <p className="text-sm text-slate-500 mt-2">{p.description}</p>}
                  <div className="text-xs text-slate-400 mt-3 space-y-1">
                    {p.address && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.address}</div>}
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.start_date || '–'} → {p.end_date || '–'}</div>
                    {p.budget && <div>Budget: {p.budget.toLocaleString('da-DK')} kr</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Images className="w-4 h-4 text-amber-500" /> Billeder</h2>
          {images.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-10 text-center text-slate-400">Ingen billeder endnu.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((im) => (
                <div key={im.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <div className="aspect-square"><Image src={im.image_url} fittingType="fill" className="w-full h-full" /></div>
                  <div className="p-2">
                    {im.caption && <div className="text-xs text-slate-600 truncate">{im.caption}</div>}
                    <div className="text-[10px] text-slate-400">{im.project_name} • {im.phase}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-amber-500" /> Fakturaer</h2>
          {invoices.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-10 text-center text-slate-400">Ingen fakturaer.</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr><th className="text-left px-4 py-2">Nr.</th><th className="text-left px-4 py-2">Projekt</th><th className="text-left px-4 py-2">Dato</th><th className="text-left px-4 py-2">Forfald</th><th className="text-right px-4 py-2">Beløb</th><th className="text-left px-4 py-2">Status</th></tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-700">{inv.invoice_number}</td>
                      <td className="px-4 py-2 text-slate-600">{inv.project_name || '–'}</td>
                      <td className="px-4 py-2 text-slate-500">{inv.date || '–'}</td>
                      <td className="px-4 py-2 text-slate-500">{inv.due_date || '–'}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">{invTotal(inv).toLocaleString('da-DK')} kr</td>
                      <td className="px-4 py-2"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${INV_STYLE[inv.status] || 'bg-slate-100'}`}>{inv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}