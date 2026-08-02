import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ForsideLayout from '@/components/forside/ForsideLayout';
import { services, process } from '@/components/forside/forsideData';

export default function Tjenester() {
  return (
    <ForsideLayout>
      <section className="pt-32 pb-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium mb-4">
            Hvad vi tilbyder
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Vores tjenester</h1>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto">
            Vi dækker hele spektret af entreprenøropgaver — fra første spadestik til færdigt anlæg.
          </p>
        </div>
      </section>

      <section className="pb-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-amber-300 transition group">
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center mb-4 transition">
                  <s.icon className="w-6 h-6 text-slate-700 group-hover:text-amber-600 transition" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Sådan arbejder vi</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">En enkel og gennemsigtig proces — fra første kontakt til færdigt resultat.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((p, i) => (
              <div key={i} className="relative bg-white rounded-2xl border border-slate-200 p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <p.icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
                {i < process.length - 1 && (
                  <ArrowRight className="hidden lg:block w-5 h-5 text-slate-300 absolute top-1/2 -right-3.5 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Klar til at starte dit projekt?</h2>
          <p className="text-slate-400 mt-3">Få et uforpligtende tilbud — eller kontakt os for en snak.</p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link to="/beregn-tilbud" className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3.5 rounded-xl font-semibold hover:bg-amber-300 transition">
              Beregn dit tilbud <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/kontakt" className="inline-flex items-center gap-2 border border-slate-700 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition">
              Kontakt os
            </Link>
          </div>
        </div>
      </section>
    </ForsideLayout>
  );
}