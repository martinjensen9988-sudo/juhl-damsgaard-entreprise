import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { generateQuotePDF } from '@/lib/quotePdf';
import { formatDKK, calcSubtotal, calcVAT, calcTotal, formatDate } from '@/lib/format';
import { Check, X, FileText, CheckCircle2, XCircle, ArrowLeft, Download } from 'lucide-react';

export default function TilbudVisning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const q = await base44.entities.Quote.get(id);
        setQuote(q);
        const cs = await base44.entities.CompanySettings.list('-created_date', 10);
        setCompany(cs[0] || {});
        await base44.functions.invoke('quoteAction', { quote_id: id, action: 'view' });
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || 'Kunne ikke hente tilbud');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      await generateQuotePDF(quote, company);
    } catch (e) {
      alert('Kunne ikke generere PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleAction = async (action) => {
    setActing(true);
    try {
      const res = await base44.functions.invoke('quoteAction', { quote_id: id, action });
      if (res.data?.status) {
        setQuote({ ...quote, status: res.data.status });
      } else if (res.data?.error) {
        alert(res.data.error);
      }
    } catch (e) {
      alert('Kunne ikke registrere dit svar. Prøv igen.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-slate-600">{error}</p>
        <Button variant="outline" onClick={() => navigate('/portal')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Tilbage til portal
        </Button>
      </div>
    );
  }

  if (!quote) return null;

  const isPending = quote.status === 'Sendt';
  const isAccepted = quote.status === 'Accepteret';
  const isRejected = quote.status === 'Afvist';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Tilbud</div>
              <div className="font-bold text-slate-900 text-lg">{quote.quote_number}</div>
            </div>
          </div>
          <Button
            onClick={downloadPDF}
            disabled={pdfLoading}
            variant="outline"
            size="sm"
          >
            {pdfLoading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            Download PDF
          </Button>
          {isAccepted && (
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 className="w-5 h-5" /> Accepteret
            </div>
          )}
          {isRejected && (
            <div className="flex items-center gap-2 text-red-500 font-medium">
              <XCircle className="w-5 h-5" /> Afvist
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400">Til</div>
            <div className="font-medium text-slate-900">{quote.customer_name || '—'}</div>
          </div>
          <div>
            <div className="text-slate-400">Dato</div>
            <div className="font-medium text-slate-900">{formatDate(quote.date)}</div>
          </div>
          {quote.valid_until && (
            <div>
              <div className="text-slate-400">Gyldig til</div>
              <div className="font-medium text-slate-900">{formatDate(quote.valid_until)}</div>
            </div>
          )}
          {quote.project_name && (
            <div>
              <div className="text-slate-400">Projekt</div>
              <div className="font-medium text-slate-900">{quote.project_name}</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Tilbudsliste</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-3">Beskrivelse</th>
                <th className="px-4 py-3 text-right">Antal</th>
                <th className="px-4 py-3 text-right">Stk. pris</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(quote.line_items || []).map((item, i) => (
                <tr key={i}>
                  <td className="px-6 py-3 text-slate-900">{item.description || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatDKK(item.unit_price || 0)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatDKK((item.quantity || 0) * (item.unit_price || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>{formatDKK(calcSubtotal(quote.line_items))}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Moms (25%)</span>
            <span>{formatDKK(calcVAT(calcSubtotal(quote.line_items)))}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total</span>
            <span>{formatDKK(calcTotal(quote.line_items))}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Bemærkninger</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {isPending && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Vil du acceptere dette tilbud?</h3>
          <div className="flex gap-3">
            <Button
              onClick={() => handleAction('accept')}
              disabled={acting}
              className="bg-emerald-600 hover:bg-emerald-700 flex-1"
            >
              <Check className="w-5 h-5 mr-2" /> Accepter tilbud
            </Button>
            <Button
              onClick={() => handleAction('reject')}
              disabled={acting}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="w-5 h-5 mr-2" /> Afvis
            </Button>
          </div>
          {acting && <p className="text-sm text-slate-400 text-center mt-3">Behandler...</p>}
        </div>
      )}

      {isAccepted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold text-slate-900">Tak! Tilbuddet er accepteret.</p>
          <p className="text-sm text-slate-500 mt-1">Vi kontakter dig hurtigst muligt for at planlægge opstarten.</p>
        </div>
      )}

      {isRejected && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
          <XCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Tilbuddet er afvist.</p>
          <p className="text-sm text-slate-500 mt-1">Hvis du har spørgsmål, er du velkommen til at kontakte os.</p>
        </div>
      )}

      <div className="text-center">
        <Button variant="ghost" onClick={() => navigate('/portal')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Tilbage til portal
        </Button>
      </div>
    </div>
  );
}