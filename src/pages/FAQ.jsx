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

export default function FAQ() {
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
            Her finder du svar på de mest almindelige spørgsmål om vores tjenester, processer og vilkår.
            Mangler du svar på noget, er du altid velkommen til at kontakte os.
          </p>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
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