import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, ArrowRight, Phone } from 'lucide-react';
import ForsideLayout from '@/components/forside/ForsideLayout';
import { services } from '@/components/forside/forsideData';

export default function TjenesteDetalje() {
  const { slug } = useParams();
  const service = services.find((s) => s.slug === slug);

  if (!service) return <Navigate to="/tjenester" replace />;

  const Icon = service.icon;

  return (
    <ForsideLayout>
      <section className="pt-32 pb-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/tjenester" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-6 transition">
            <ArrowLeft className="w-4 h-4" /> Tilbage til tjenester
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Icon className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{service.title}</h1>
          </div>
          <p className="text-lg text-slate-500 leading-relaxed">{service.desc}</p>
        </div>
      </section>

      <section className="pb-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed text-base">{service.longDesc}</p>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Det tilbyder vi</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {service.highlights.map((h) => (
                <div key={h} className="flex items-start gap-2.5 bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white">Skal vi løse din opgave?</h2>
          <p className="text-slate-400 mt-3">Få et uforpligtende tilbud på {service.title.toLowerCase()} — eller kontakt os for en snak.</p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link to="/beregn-tilbud" className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3.5 rounded-xl font-semibold hover:bg-amber-300 transition">
              Beregn dit tilbud <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/kontakt" className="inline-flex items-center gap-2 border border-slate-700 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition">
              <Phone className="w-4 h-4" /> Kontakt os
            </Link>
          </div>
        </div>
      </section>
    </ForsideLayout>
  );
}