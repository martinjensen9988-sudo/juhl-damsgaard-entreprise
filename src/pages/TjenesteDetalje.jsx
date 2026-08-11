import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Phone } from 'lucide-react';
import ForsideLayout from '@/components/forside/ForsideLayout';
import { services } from '@/components/forside/forsideData';
import { serviceSeoPages } from '@/data/serviceSeoPages';
import { faqSchema, serviceSchema, useSeo } from '@/lib/seo';
import { BRAND_PHONE_DISPLAY, BRAND_PHONE_LINK } from '@/lib/brand';

export default function TjenesteDetalje({ slug: slugProp }) {
  const params = useParams();
  const slug = slugProp || params.slug;
  const requestedService = services.find((s) => s.slug === slug);
  const service = requestedService || services[0];

  const seo = serviceSeoPages[slug] || {
    title: `${service.title} | Juhl & Damsgaard Entreprise`,
    metaDescription: service.desc,
    heading: service.title,
    slug,
    shortName: service.title.toLowerCase(),
    image: {
      src: '/assets/juhl-damsgaard-logo.jpeg',
      alt: 'Juhl & Damsgaard Entreprise logo',
    },
    areas: ['Fyn', 'Jylland', 'Odense', 'Kolding', 'Vejle'],
    lead: service.desc,
    sections: [
      {
        h: `Om ${service.title.toLowerCase()}`,
        p: service.longDesc,
      },
    ],
    faq: [
      {
        q: `Kan jeg få tilbud på ${service.title.toLowerCase()}?`,
        a: 'Ja. Send adresse, billeder og en kort beskrivelse, så vender vi tilbage med et konkret prisgrundlag.',
      },
    ],
  };

  const Icon = service.icon;
  const canonicalPath = `/tjenester/${seo.slug}`;

  useSeo({
    title: seo.title,
    description: seo.metaDescription,
    canonicalPath,
    image: `https://juhldamsgaard.dk${seo.image.src}`,
    schema: [serviceSchema(seo), faqSchema(seo.faq, canonicalPath)],
  });

  if (!requestedService) return <Navigate to="/tjenester" replace />;

  return (
    <ForsideLayout>
      <section className="pt-32 pb-14 bg-[#1c1714] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <Link to="/tjenester" className="inline-flex items-center gap-2 text-stone-300 hover:text-white text-sm mb-7 transition">
            <ArrowLeft className="w-4 h-4" /> Tilbage til tjenester
          </Link>
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#d9a17f]/12 border border-[#d9a17f]/35 text-[#ffd1b1] text-sm font-bold mb-5">
                <Icon className="w-4 h-4" />
                Entreprenør på Fyn og i Jylland
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{seo.heading}</h1>
              <p className="text-lg text-stone-200 mt-6 leading-relaxed max-w-2xl">{seo.lead}</p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/beregn-tilbud" className="inline-flex items-center gap-2 bg-[#d9a17f] text-[#1c1714] px-6 py-3.5 rounded-md font-black hover:bg-[#e8b996] transition">
                  Få tilbud <ArrowRight className="w-4 h-4" />
                </Link>
                <a href={`tel:${BRAND_PHONE_LINK}`} className="inline-flex items-center gap-2 border border-white/25 text-white px-6 py-3.5 rounded-md font-bold hover:bg-white/10 transition">
                  <Phone className="w-4 h-4" /> {BRAND_PHONE_DISPLAY}
                </a>
              </div>
            </div>
            <div className="bg-stone-50 rounded-lg border border-stone-200 p-4 shadow-2xl">
              <img src={seo.image.src} alt={seo.image.alt} className="w-full aspect-[4/3] object-contain rounded-md bg-white" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[0.72fr_0.28fr] gap-10 items-start">
          <article className="space-y-9">
            {seo.sections.map((section) => (
              <section key={section.h}>
                <h2 className="text-2xl font-black text-zinc-950 tracking-tight">{section.h}</h2>
                <p className="text-zinc-700 leading-relaxed mt-3">{section.p}</p>
              </section>
            ))}
          </article>

          <aside className="lg:sticky lg:top-28 space-y-5">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-5">
              <h2 className="font-black text-zinc-950">Det tilbyder vi</h2>
              <div className="space-y-3 mt-4">
                {service.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2.5 text-sm text-zinc-700">
                    <CheckCircle2 className="w-4 h-4 text-[#9f5f3b] flex-shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-5">
              <h2 className="font-black text-zinc-950">Lokal dækning</h2>
              <div className="flex flex-wrap gap-2 mt-4">
                {seo.areas.map((area) => (
                  <span key={area} className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-bold text-zinc-700">
                    <MapPin className="w-3 h-3 text-[#9f5f3b]" /> {area}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="py-16 bg-stone-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-9">
            <h2 className="text-3xl font-black text-zinc-950">FAQ om {seo.shortName}</h2>
            <p className="text-zinc-600 mt-3">Svar på de typiske spørgsmål før du beder om tilbud.</p>
          </div>
          <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden bg-white">
            {seo.faq.map((item) => (
              <details key={item.q} className="group p-5 open:bg-stone-50 transition">
                <summary className="font-bold text-zinc-950 cursor-pointer list-none flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-[#9f5f3b] group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="text-zinc-700 text-sm mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#1c1714]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white">Få tilbud på {seo.shortName}</h2>
          <p className="text-stone-300 mt-3 max-w-2xl mx-auto">
            Send billeder, adresse og en kort beskrivelse. Så laver vi et tilbud med arbejde, materialer, moms og en tydelig opgavebeskrivelse.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link to="/beregn-tilbud" className="inline-flex items-center gap-2 bg-[#d9a17f] text-[#1c1714] px-6 py-3.5 rounded-md font-black hover:bg-[#e8b996] transition">
              Få tilbud <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/kontakt" className="inline-flex items-center gap-2 border border-stone-700 text-white px-6 py-3.5 rounded-md font-bold hover:bg-white/10 transition">
              Kontakt os
            </Link>
          </div>
        </div>
      </section>
    </ForsideLayout>
  );
}
