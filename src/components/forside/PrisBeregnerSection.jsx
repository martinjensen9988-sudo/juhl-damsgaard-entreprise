import { useState } from 'react';
import { Bot, ClipboardList } from 'lucide-react';
import ForsidePrisberegner from '@/components/forside/ForsidePrisberegner';
import AiTilbudChat from '@/components/forside/AiTilbudChat';

export default function PrisBeregnerSection() {
  const [tab, setTab] = useState('ai');

  return (
    <>
      {/* Tabs */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          <button
            onClick={() => setTab('ai')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === 'ai' ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4" /> AI Beregning
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === 'manual' ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Manuel Beregning
          </button>
        </div>
      </div>

      {tab === 'ai' ? <AiTilbudChat /> : <ForsidePrisberegner />}
    </>
  );
}