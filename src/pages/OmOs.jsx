import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowRight, Star, Quote } from 'lucide-react';
import ForsideLayout from '@/components/forside/ForsideLayout';
import { stats, benefits, testimonials } from '@/components/forside/forsideData';

export default function OmOs() {
  return (
    <ForsideLayout>
      <section className="pt-32 pb-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium mb-4">
            Om virksomheden
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Om os</h1>
          <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
            Med årtiers erfaring i entreprenørbranchen ved vi, at hvert projekt er unikt.
            Vi kombinerer traditionelt håndværk med moderne teknik — og sørger altid for
            at levere et resultat, du kan stole på.
          </p>
        </div>
      </section>

      <section className="bg-amber-400 text-slate-950 py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-bold tracking-tight">{s.value}</div>
              <div className="text-sm font-medium mt-2 opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Hvorfor vælge os?</h2>
              <div className="space-y-4 mt-8">
                {benefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <b.icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{b.title}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }} />
              <div className="relative">
                <Truck className="w-10 h-10 text-amber-400 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Klar til at starte?</h3>
                <p className="text-slate-400 mb-6">Få en uforpligtende snak om dit næste projekt. Vi vender tilbage inden for 24 timer.</p>
                <Link to="/kontakt" className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-semibold hover:bg-amber-300 transition">
                  Kontakt os <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Hvad vores kunder siger</h2>
            <p className="text-slate-400 mt-3">Tilfredse kunder er vores bedste reference.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <Quote className="w-8 h-8 text-amber-400/40 mb-4" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-amber-400">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ForsideLayout>
  );
}