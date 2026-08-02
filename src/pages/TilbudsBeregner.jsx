import React from 'react';
import { Link } from 'react-router-dom';
import ForsidePrisberegner from '@/components/forside/ForsidePrisberegner';
import { Calculator, ArrowRight, Sparkles, Bot } from 'lucide-react';

export default function TilbudsBeregner() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Calculator className="w-5 h-5 text-amber-600" /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Tilbudsberegner</h1>
          <p className="text-slate-500 mt-0.5">Vælg ydelser og se din vejledende pris — eller brug vores AI</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Prøv vores AI-tilbudsberegner</h3>
            <p className="text-sm text-slate-600 mt-0.5">Beskriv din opgave med egne ord, og få et komplet tilbud med materialer og alt inkluderet.</p>
          </div>
        </div>
        <Link to="/forside#prisberegner" className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-300 transition whitespace-nowrap">
          <Sparkles className="w-4 h-4" /> Prøv AI <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <ForsidePrisberegner />
    </div>
  );
}