import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { Send, Loader2, Bot, User, Calculator, ArrowRight, Sparkles } from 'lucide-react';

export default function AiTilbudChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hej! Jeg er Juhl & Damsgaards AI-tilbudsberegner. Beskriv din opgave, så udregner jeg et vejledende tilbud med materialer og alt hvad det kræver. Timeprisen er 350 kr/time inkl. moms. Du kan f.eks. skrive: "Jeg skal have gravet og støbt et fundament på 50 m² og lagt asfalt på indkørslen på 80 m²."' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const estimateDescription = estimate?.task_description || estimate?.cleaned_notes || estimate?.message || '';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    setEstimate(null);
    try {
      const res = await base44.functions.invoke('aiQuoteCalculator', { message: userMsg });
      const data = res.data || res;
      const aiMsg = data.message || 'Beklager, jeg kunne ikke beregne et tilbud lige nu. Prøv at beskrive din opgave mere detaljeret.';
      setMessages(m => [...m, { role: 'assistant', content: aiMsg }]);
      if (data.line_items && data.line_items.length > 0) {
        setEstimate(data);
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Der opstod en fejl. Prøv igen senere eller kontakt os direkte.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Chat */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 flex flex-col h-[520px]">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <Bot className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              AI Tilbudsberegner
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xs text-slate-500">Beskriv din opgave, så udregner vi prisen</div>
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-amber-100'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-amber-600" />}
              </div>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
              </div>
              <div className="bg-slate-100 rounded-2xl px-4 py-2.5 text-sm text-slate-500 flex items-center gap-2">
                Beregner dit tilbud
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Beskriv din opgave..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
              disabled={loading}
            />
            <button onClick={send} disabled={loading || !input.trim()} className="bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-semibold hover:bg-amber-300 transition disabled:opacity-50 flex items-center gap-1.5 text-sm">
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </div>
      </div>

      {/* Estimate summary */}
      <div className="lg:col-span-2">
        <div className="bg-slate-950 text-white rounded-2xl p-6 lg:sticky lg:top-24 border border-slate-800 h-[520px] flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-semibold text-lg">AI estimat</h3>
          </div>
          {!estimate ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <Calculator className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400 max-w-[200px] mx-auto">
                  Dit tilbud vises her når AI'en har beregnet det.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-1">
                {estimateDescription && (
                  <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-sm text-slate-300 leading-relaxed">
                    {estimateDescription}
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  Timepris: 350 kr/time inkl. moms. Tilbudslinjer vises ekskl. moms, og moms lægges på nederst.
                </div>
                {estimate.line_items?.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200">{item.description}</div>
                      <div className="text-xs text-slate-500">{item.quantity} {item.unit} × {formatDKK(item.unit_price)}</div>
                    </div>
                    <div className="font-medium text-right">{formatDKK(item.line_total || (item.quantity * item.unit_price))}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Subtotal ekskl. moms</span><span>{formatDKK(estimate.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Moms (25%)</span><span>{formatDKK(estimate.vat)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t border-slate-700">
                  <span>Total inkl. moms</span><span className="text-amber-400">{formatDKK(estimate.total)}</span>
                </div>
                <button onClick={() => estimate && navigate('/forespoergsel', { state: { estimate, source: 'AI tilbudschat' } })} className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-semibold hover:bg-amber-300 transition text-sm disabled:opacity-50" disabled={!estimate}>
                  Send forespørgsel <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">Uforpligtende estimat. Kontakt os for et endeligt tilbud.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
