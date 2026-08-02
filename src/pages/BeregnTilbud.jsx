import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import ForsideLayout from '@/components/forside/ForsideLayout';
import PrisBeregnerSection from '@/components/forside/PrisBeregnerSection';

export default function BeregnTilbud() {
  return (
    <ForsideLayout>
      <section className="pt-32 pb-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium mb-4">
              <ClipboardCheck className="w-4 h-4" /> Beregn selv
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Beregn dit tilbud</h1>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              Brug vores AI til at beskrive din opgave og få et komplet tilbud — eller vælg ydelser selv manuelt.
            </p>
          </div>
          <PrisBeregnerSection />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Brug for hjælp?</h2>
          <p className="text-slate-500 mt-3">Vores team står klar til at rådgive dig om dit projekt.</p>
          <Link to="/kontakt" className="inline-flex items-center gap-2 mt-6 bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-semibold hover:bg-amber-300 transition">
            Kontakt os <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </ForsideLayout>
  );
}