import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import ForsideLayout from '@/components/forside/ForsideLayout';
import ForsideKontaktForm from '@/components/forside/ForsideKontaktForm';

export default function Kontakt() {
  return (
    <ForsideLayout>
      <section className="pt-32 pb-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium mb-4">
            Vi er her for dig
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Kontakt os</h1>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto">Ring eller skriv — vi er klar til at hjælpe med dit projekt.</p>
        </div>
      </section>

      <section className="pb-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <a href="tel:+4500000000" className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center hover:border-amber-400 hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200 transition">
                <Phone className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-sm text-slate-500 mb-1">Ring til os</div>
              <div className="font-semibold text-slate-900">+45 00 00 00 00</div>
            </a>
            <a href="mailto:info@juhldamsgaard.dk" className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center hover:border-amber-400 hover:shadow-lg transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200 transition">
                <Mail className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-sm text-slate-500 mb-1">Skriv til os</div>
              <div className="font-semibold text-slate-900">info@juhldamsgaard.dk</div>
            </a>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-sm text-slate-500 mb-1">Besøg os</div>
              <div className="font-semibold text-slate-900">Karup, Midtjylland</div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <ForsideKontaktForm />
        </div>
      </section>
    </ForsideLayout>
  );
}