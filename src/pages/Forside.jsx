import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Award, CheckCircle2, Clock, FileText, HardHat, HelpCircle,
  Phone, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Image } from '@/components/ui/image';
import ForsideLayout from '@/components/forside/ForsideLayout';
import InteraktivtHus from '@/components/forside/InteraktivtHus';
import { stats, allServices, faqItems } from '@/components/forside/forsideData';
import { BRAND_LOGO_FULL_URL } from '@/lib/brand';

const heroStats = [
  { value: 'Fyn & Jylland', label: 'Fast arbejdsområde' },
  { value: '350 kr.', label: 'Timepris inkl. moms' },
  { value: '24t', label: 'Typisk svartid' },
];

const focusAreas = [
  'Gravearbejde og jord',
  'Kloak, dræn og regnvand',
  'Beton, fundament og støbning',
  'Tømrer, VVS og el',
  'Skadeservice og forsikring',
  'Totalentreprise fra start til slut',
];

export default function Forside() {
  return (
    <ForsideLayout>
      <section className="relative min-h-[calc(100vh-24px)] pt-28 pb-12 overflow-hidden bg-[#1c1714]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1800&q=85"
            alt="Entreprenørarbejde på byggeplads med maskiner og rå byggematerialer"
            className="w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#100d0b]/98 via-[#1c1714]/92 to-[#3d2a21]/82" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100d0b]/92 via-transparent to-[#100d0b]/34" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
            <div className="max-w-3xl rounded-lg bg-[#100d0b]/58 border border-white/10 p-4 sm:p-6 shadow-2xl backdrop-blur-[2px]">
              <Image
                src={BRAND_LOGO_FULL_URL}
                fittingType="fit"
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg bg-stone-50 ring-1 ring-white/20 shadow-2xl mb-7 overflow-hidden"
                alt="Juhl & Damsgaard Entreprise logo"
              />
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1c1714]/88 border border-[#d9a17f]/60 text-[#ffd1b1] text-sm font-semibold mb-5 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                Entreprenør, byggeri og service samlet ét sted
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.03] max-w-3xl">
                Juhl & Damsgaard Entreprise
              </h1>
              <p className="text-lg sm:text-xl text-white mt-6 max-w-2xl leading-relaxed drop-shadow">
                Vi løser bygge- og anlægsopgaver fra første spadetag til færdig aflevering:
                gravearbejde, kloak, beton, tømrer, VVS, el, skadeservice og totalentreprise.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/beregn-tilbud" className="inline-flex items-center gap-2 bg-[#d9a17f] text-[#1c1714] px-6 py-3.5 rounded-md font-bold hover:bg-[#e8b996] transition shadow-lg shadow-black/20">
                  Få AI-tilbud <Sparkles className="w-4 h-4" />
                </Link>
                <Link to="/kontakt" className="inline-flex items-center gap-2 bg-white text-zinc-950 px-6 py-3.5 rounded-md font-bold hover:bg-stone-100 transition">
                  Kontakt os <Phone className="w-4 h-4" />
                </Link>
                <Link to="/tjenester" className="inline-flex items-center gap-2 border border-white/60 bg-[#100d0b]/40 text-white px-6 py-3.5 rounded-md font-bold hover:bg-white/10 transition">
                  Se tjenester <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-10 max-w-2xl">
                {heroStats.map((item) => (
                  <div key={item.label} className="border-l border-[#d9a17f]/70 bg-[#100d0b]/48 rounded-r-md px-3 py-2">
                    <div className="text-white font-black text-lg sm:text-xl leading-tight">{item.value}</div>
                    <div className="text-stone-100 text-xs sm:text-sm mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 sm:p-6 shadow-2xl">
                <div className="flex items-start gap-4 pb-5 border-b border-stone-200">
                  <div className="w-12 h-12 rounded-md bg-[#1c1714] flex items-center justify-center flex-shrink-0">
                    <HardHat className="w-6 h-6 text-[#d9a17f]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#9f5f3b] font-bold">Projektklar</p>
                    <h2 className="text-2xl font-black text-zinc-950 mt-1">Alt det praktiske samlet</h2>
                    <p className="text-zinc-700 text-sm mt-2 leading-relaxed">
                      Beskriv din opgave og få et hurtigt prisgrundlag med arbejdsløn,
                      materialer, moms og en tydelig beskrivelse af arbejdet.
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  {focusAreas.map((area) => (
                    <div key={area} className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                      <CheckCircle2 className="w-4 h-4 text-[#9f5f3b] flex-shrink-0" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-[#1c1714] text-white rounded-md p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-stone-300">Tilbudsgrundlag</div>
                    <div className="font-black">Arbejde + materialer + beskrivelse</div>
                  </div>
                  <FileText className="w-8 h-8 text-[#d9a17f] flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <InteraktivtHus />

      <section className="bg-[#9f5f3b] text-white py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-5xl font-black tracking-tight">{s.value}</div>
              <div className="text-sm font-semibold mt-2 text-white/82">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-10 items-start">
            <div className="lg:sticky lg:top-28">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#9f5f3b]/10 border border-[#9f5f3b]/20 text-[#9f5f3b] text-sm font-bold mb-4">
                <CheckCircle2 className="w-4 h-4" /> Alt hvad vi laver
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-zinc-950 tracking-tight">
                Én entreprenør til hele opgaven
              </h2>
              <p className="text-zinc-600 mt-4 leading-relaxed">
                Vi udfører både enkeltopgaver og samlede entrepriser for private, foreninger
                og erhverv: gravearbejde, kloak, beton, tømrer, VVS, el, skadeservice og totalentreprise.
              </p>
              <Link to="/beregn-tilbud" className="mt-7 inline-flex items-center gap-2 bg-[#1c1714] text-white px-5 py-3 rounded-md font-bold hover:bg-[#2d241f] transition">
                Beregn pris <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-8">
              {allServices.map((cat) => (
                <div key={cat.title} className="border border-stone-200 bg-white rounded-lg p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-md bg-[#1c1714] flex items-center justify-center">
                      <cat.icon className="w-5 h-5 text-[#d9a17f]" />
                    </div>
                    <h3 className="text-xl font-black text-zinc-950">{cat.title}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {cat.items.map((it) => (
                      <Link
                        key={it.name}
                        to={it.slug ? `/tjenester/${it.slug}` : '/tjenester'}
                        className="group rounded-md border border-stone-200 p-4 hover:border-[#9f5f3b]/60 hover:bg-stone-50 transition flex gap-3"
                      >
                        <it.icon className="w-5 h-5 text-[#9f5f3b] flex-shrink-0 mt-0.5" />
                        <span>
                          <span className="block font-bold text-zinc-950 text-sm">{it.name}</span>
                          <span className="block text-xs text-zinc-500 leading-relaxed mt-1">{it.desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Dokumenteret arbejde', text: 'Billeder, beskrivelser og kvalitetssikring kan følge opgaven fra start til aflevering.' },
              { icon: Clock, title: 'Hurtig afklaring', text: 'AI-tilbud og kontaktformular gør det nemt at komme fra idé til konkret prisgrundlag.' },
              { icon: Award, title: 'Samlet ansvar', text: 'Vi koordinerer fagene, så kunden ikke skal styre flere håndværkere og leverandører.' },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-stone-200 p-6 bg-stone-50">
                <item.icon className="w-8 h-8 text-[#9f5f3b]" />
                <h3 className="font-black text-xl text-zinc-950 mt-4">{item.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed mt-2">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-stone-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#9f5f3b]/10 border border-[#9f5f3b]/20 text-[#9f5f3b] text-sm font-bold mb-4">
              <HelpCircle className="w-4 h-4" /> FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-950 tracking-tight">
              Ofte stillede spørgsmål
            </h2>
            <p className="text-zinc-600 mt-4">
              Svar på de vigtigste spørgsmål om opgaver, tilbud og arbejdsområde.
            </p>
          </div>
          <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden bg-white">
            {faqItems.slice(0, 5).map((item, i) => (
              <details key={i} className="group p-5 open:bg-stone-50 transition">
                <summary className="font-bold text-zinc-950 cursor-pointer list-none flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-[#9f5f3b] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="text-zinc-600 text-sm mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/faq" className="inline-flex items-center gap-2 bg-[#1c1714] text-white px-6 py-3.5 rounded-md font-bold hover:bg-[#2d241f] transition">
              Se alle spørgsmål <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </ForsideLayout>
  );
}
