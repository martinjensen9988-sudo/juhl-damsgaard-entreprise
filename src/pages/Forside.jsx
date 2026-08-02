import React from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat, Droplets, Layers, Building2, Hammer, Trees,
  ArrowRight, Phone, Mail, MapPin, ShieldCheck, Clock, Award,
  ClipboardCheck, FileText, Truck, CheckCircle2, Star, Quote,
} from 'lucide-react';
import PrisBeregnerSection from '@/components/forside/PrisBeregnerSection';

const services = [
  { icon: HardHat, title: 'Gravearbejde', desc: 'Professionelt gravearbejde til alle formål — fra fundamenter til ledningsgraving.' },
  { icon: Droplets, title: 'Kloak & Dræn', desc: 'Kloaklægning, omtilslutninger og drænløsninger udført efter gældende normer.' },
  { icon: Layers, title: 'Asfalt & Brolægning', desc: 'Asfaltlægning, brolægning og flisearbejde med holdbart resultat.' },
  { icon: Building2, title: 'Beton & Støbning', desc: 'Betonarbejde, fundamenter og støbning til både små og store projekter.' },
  { icon: Hammer, title: 'Nedrivning', desc: 'Sikker og effektiv nedrivning af bygninger og installationer.' },
  { icon: Trees, title: 'Anlæg & Udearealer', desc: 'Anlægsarbejde, haveanlæg og udearealer skræddersyet til din ejendom.' },
];

const stats = [
  { value: '25+', label: 'År i branchen' },
  { value: '500+', label: 'Projekter gennemført' },
  { value: '100%', label: 'Tilfredse kunder' },
  { value: '24t', label: 'Svartid' },
];

const benefits = [
  { icon: ShieldCheck, title: 'Faglig ekspertise', desc: 'Erhvervserfaren og certificeret til alle opgaver.' },
  { icon: Clock, title: 'Tilbageholdte deadlines', desc: 'Vi leverer til tiden — hver gang.' },
  { icon: Award, title: 'Kvalitetsgaranti', desc: 'Håndværk i topklasse med kvalitetssikring på alle projekter.' },
];

const process = [
  { icon: Phone, title: '1. Kontakt', desc: 'Ring eller skriv til os. Vi lytter til dine behov og rådgiver dig.' },
  { icon: FileText, title: '2. Tilbud', desc: 'Du får et uforpligtende og transparent tilbud — hurtigt og præcist.' },
  { icon: ClipboardCheck, title: '3. Udførelse', desc: 'Vores erfarne team udfører opgaven professionelt og til tiden.' },
  { icon: CheckCircle2, title: '4. Færdigt', desc: 'Vi afleverer et resultat i topklasse — og rydder op efter os.' },
];

const testimonials = [
  { name: 'Lars Pedersen', role: 'Privat, Odense', text: 'Fantastisk samarbejde fra start til slut. De gravede og lagde kloak for os — alt gik hurtigt og professionelt.', rating: 5 },
  { name: 'Anne Mortensen', role: 'Bygherre, Kerteminde', text: 'Vi har brugt Juhl & Damsgaard på flere projekter. Altid til tiden, og kvaliteten er i top. Klart anbefales.', rating: 5 },
  { name: 'Kasper Lund', role: 'Entreprenør, Svendborg', text: 'Faglig ekspertise og fair priser. De leverede asfalt- og betonarbejde til en stor opgave for os.', rating: 5 },
];

export default function Forside() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-bold text-white tracking-tight">Juhl & Damsgaard</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#tjenester" className="hover:text-amber-400 transition">Tjenester</a>
            <a href="#prisberegner" className="hover:text-amber-400 transition">Prisberegner</a>
            <a href="#om-os" className="hover:text-amber-400 transition">Om os</a>
            <a href="#kontakt" className="hover:text-amber-400 transition">Kontakt</a>
          </div>
          <Link to="/login" className="text-sm font-medium text-slate-950 bg-amber-400 px-4 py-2 rounded-lg hover:bg-amber-300 transition">
            Log ind
          </Link>
        </div>
      </nav>

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
              Din lokale entreprenør på Fyn
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
              <a href="#prisberegner" className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3.5 rounded-xl font-semibold hover:bg-amber-300 transition shadow-lg shadow-amber-400/20">
                Beregn dit tilbud <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#tjenester" className="inline-flex items-center gap-2 border border-slate-700 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition">
                Se vores tjenester
              </a>
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

      {/* Price Calculator */}
      <section id="prisberegner" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium mb-4">
              <ClipboardCheck className="w-4 h-4" /> Beregn selv
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Beregn dit tilbud</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Brug vores AI til at beskrive din opgave og få et komplet tilbud — eller vælg ydelser selv manuelt.
            </p>
          </div>
          <PrisBeregnerSection />
        </div>
      </section>

      {/* Services */}
      <section id="tjenester" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Vores tjenester</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Vi dækker hele spektret af entreprenøropgaver — fra første spadestik til færdigt anlæg.
            </p>
          </div>
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

      {/* Process */}
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

      {/* About / Benefits */}
      <section id="om-os" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Hvorfor vælge os?</h2>
              <p className="text-slate-500 mt-4 leading-relaxed">
                Med årtiers erfaring i entreprenørbranchen ved vi, at hvert projekt er unikt.
                Vi kombinerer traditionelt håndværk med moderne teknik — og sørger altid for
                at levere et resultat, du kan stole på.
              </p>
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
                <a href="#kontakt" className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-semibold hover:bg-amber-300 transition">
                  Kontakt os <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
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

      {/* Contact */}
      <section id="kontakt" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Kontakt os</h2>
            <p className="text-slate-500 mt-3">Ring eller skriv — vi er klar til at hjælpe med dit projekt.</p>
          </div>
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
              <div className="font-semibold text-slate-900">Hovedvej 1, 1000 By</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-amber-400 flex items-center justify-center">
              <HardHat className="w-4 h-4 text-slate-950" />
            </div>
            <span className="font-bold text-white">Juhl & Damsgaard Entreprise</span>
          </div>
          <div className="text-sm text-slate-500">© 2026 Juhl & Damsgaard Entreprise. Alle rettigheder forbeholdt.</div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <Link to="/portal" className="hover:text-amber-400 transition">Kundeportal</Link>
            <Link to="/login" className="hover:text-amber-400 transition">Log ind</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}