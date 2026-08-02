import React from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat,
  ArrowRight, ShieldCheck, Clock, Award,
} from 'lucide-react';
import ForsideLayout from '@/components/forside/ForsideLayout';
import { stats } from '@/components/forside/forsideData';

export default function Forside() {
  return (
    <ForsideLayout>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=80"
            alt="Gravemaskine på byggeplads"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/85 to-slate-950" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              Din entreprenør i hele Fyn og Jylland
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.05]">
              Vi bygger, graver og<br />
              <span className="text-amber-400">anlægger</span> med omtanke
            </h1>
            <p className="text-lg text-slate-300 mt-6 max-w-xl leading-relaxed">
              Fra gravearbejde og kloak til asfalt og anlæg — vi leverer professionelt entreprenørarbejde
              med fokus på kvalitet, tid og samarbejde.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/beregn-tilbud" className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3.5 rounded-xl font-semibold hover:bg-amber-300 transition shadow-lg shadow-amber-400/20">
                Beregn dit tilbud <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/tjenester" className="inline-flex items-center gap-2 border border-slate-700 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition">
                Se vores tjenester
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-amber-400" /> Certificeret</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-400" /> Til tiden</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-400" /> Kvalitetsgaranti</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Quick links to dedicated pages */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/tjenester" className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-amber-300 transition">
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center mb-4 transition">
                <HardHat className="w-6 h-6 text-slate-700 group-hover:text-amber-600 transition" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">Tjenester</h3>
              <p className="text-sm text-slate-500">Se alle vores ydelser og arbejdsprocesser.</p>
              <span className="inline-flex items-center gap-1 text-sm text-amber-600 mt-3 font-medium">Læs mere <ArrowRight className="w-3.5 h-3.5" /></span>
            </Link>
            <Link to="/beregn-tilbud" className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-amber-300 transition">
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center mb-4 transition">
                <ShieldCheck className="w-6 h-6 text-slate-700 group-hover:text-amber-600 transition" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">Prisberegner</h3>
              <p className="text-sm text-slate-500">Beskriv din opgave og få et tilbud med det samme.</p>
              <span className="inline-flex items-center gap-1 text-sm text-amber-600 mt-3 font-medium">Beregn <ArrowRight className="w-3.5 h-3.5" /></span>
            </Link>
            <Link to="/om-os" className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-amber-300 transition">
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center mb-4 transition">
                <Award className="w-6 h-6 text-slate-700 group-hover:text-amber-600 transition" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">Om os</h3>
              <p className="text-sm text-slate-500">Læs om vores erfaring, værdier og kundeanbefalinger.</p>
              <span className="inline-flex items-center gap-1 text-sm text-amber-600 mt-3 font-medium">Læs mere <ArrowRight className="w-3.5 h-3.5" /></span>
            </Link>
            <Link to="/kontakt" className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-amber-300 transition">
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center mb-4 transition">
                <Clock className="w-6 h-6 text-slate-700 group-hover:text-amber-600 transition" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">Kontakt</h3>
              <p className="text-sm text-slate-500">Ring, skriv eller send en besked — vi svarer hurtigt.</p>
              <span className="inline-flex items-center gap-1 text-sm text-amber-600 mt-3 font-medium">Kontakt os <ArrowRight className="w-3.5 h-3.5" /></span>
            </Link>
          </div>
        </div>
      </section>
    </ForsideLayout>
  );
}