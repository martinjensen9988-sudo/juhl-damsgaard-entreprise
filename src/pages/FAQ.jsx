import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, ArrowRight, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import ForsideLayout from '@/components/forside/ForsideLayout';
import { faqItems } from '@/components/forside/forsideData';
import { faqSchema, useSeo } from '@/lib/seo';

export default function FAQ() {
  const groupedFaq = faqItems.reduce((groups, item) => {
    const category = item.category || 'Generelt';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});
  const categories = Object.entries(groupedFaq);

  useSeo({
    title: 'FAQ om entreprenørarbejde, priser og tilbud | Juhl & Damsgaard',
    description:
      'Stor FAQ om entreprenørarbejde, priser, tilbud, gravearbejde, kloak, beton, tømrer, VVS, elektriker, skadeservice og arbejdsområde på Fyn og i Jylland.',
    canonicalPath: '/faq',
    schema: [faqSchema(faqItems, '/faq')],
  });

  return (
    <ForsideLayout>
      {/* Hero */}
      <section className="pt-32 pb-12 bg-slate-950">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Ofte stillede spørgsmål
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Spørgsmål? <span className="text-amber-400">Vi svarer.</span>
          </h1>
          <p className="text-lg text-slate-300 mt-6 leading-relaxed">
            Her finder du svar om tilbud, priser, materialer, gravearbejde, kloak, beton,
            skadeservice, totalentreprise, betaling og hvordan vi arbejder på Fyn og i Jylland.
          </p>
        </div>
      </section>

      <section className="py-10 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(([category, items]) => (
              <a
                key={category}
                href={`#${category.toLowerCase().replaceAll(' ', '-')}`}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-700 transition"
              >
                {category} ({items.length})
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          {categories.map(([category, items]) => (
            <section key={category} id={category.toLowerCase().replaceAll(' ', '-')} className="scroll-mt-28">
              <div className="mb-5">
                <h2 className="text-2xl md:text-3xl font-black text-slate-950">{category}</h2>
                <p className="text-slate-500 mt-2">{items.length} spørgsmål og svar</p>
              </div>
              <Accordion type="single" collapsible className="space-y-3">
                {items.map((item) => (
                  <AccordionItem
                    key={item.q}
                    value={item.q}
                    className="border border-slate-200 rounded-xl px-5 data-[state=open]:border-amber-300 data-[state=open]:shadow-md transition"
                  >
                    <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl bg-slate-950 p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Stadig i tvivl?</h2>
            <p className="text-slate-300 mt-3 max-w-xl mx-auto">
              Ring til os eller send en besked — vi rådgiver dig gerne og giver et uforpligtende tilbud.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <Link to="/kontakt" className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3.5 rounded-xl font-semibold hover:bg-amber-300 transition">
                Kontakt os <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/beregn-tilbud" className="inline-flex items-center gap-2 border border-slate-700 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition">
                <Phone className="w-4 h-4" /> Beregn tilbud
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ForsideLayout>
  );
}
