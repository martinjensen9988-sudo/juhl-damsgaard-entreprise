import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Building2, CheckCircle2, Droplets, HardHat, Home,
  Info, Layers, Ruler, ShieldAlert, Snowflake, Trees, Wrench, Zap,
} from 'lucide-react';

const hotspots = [
  {
    id: 'tag',
    title: 'Tag, tømrer og vinterservice',
    desc: 'Tagværk, træarbejde, carport, udhus og snerydding på udsatte arealer.',
    slug: 'toemrerarbejde',
    label: 'Tag',
    icon: Ruler,
    x: 50,
    y: 19,
    process: ['Tjek af konstruktion', 'Materialevalg', 'Udførelse og tæt aflevering'],
  },
  {
    id: 'facade',
    title: 'Skadeservice og facadearbejde',
    desc: 'Akut hjælp ved storm-, vand- og frostskader med dokumentation til forsikring.',
    slug: 'skadeservice',
    label: 'Facade',
    icon: ShieldAlert,
    x: 28,
    y: 49,
    process: ['Besigtigelse', 'Billeddokumentation', 'Udbedring'],
  },
  {
    id: 'drift',
    title: 'Vicevært og løbende drift',
    desc: 'Tilsyn, småreparationer, serviceaftaler og vedligehold for foreninger og erhverv.',
    slug: 'vicevaert-service',
    label: 'Drift',
    icon: Wrench,
    x: 50,
    y: 58,
    process: ['Fast aftale', 'Tilsyn', 'Rapportering'],
  },
  {
    id: 'el',
    title: 'Elektriker og installationer',
    desc: 'Belysning, tavler, stikkontakter og service på eksisterende installationer.',
    slug: 'elektriker',
    label: 'El',
    icon: Zap,
    x: 70,
    y: 48,
    process: ['Behovsafklaring', 'Montering', 'Test'],
  },
  {
    id: 'vvs',
    title: 'VVS, vand og varme',
    desc: 'Installation og service på vand, varme, sanitet, rør og fittings.',
    slug: 'vvs-installationer',
    label: 'VVS',
    icon: Droplets,
    x: 76,
    y: 66,
    process: ['Gennemgang', 'Installation', 'Trykprøvning'],
  },
  {
    id: 'fundament',
    title: 'Beton, sokkel og fundament',
    desc: 'Støbning af fundamenter, sokler, gulve, trapper og industribeton.',
    slug: 'beton-stobning',
    label: 'Fundament',
    icon: Building2,
    x: 42,
    y: 76,
    process: ['Udgravning', 'Armering', 'Støbning'],
  },
  {
    id: 'kloak',
    title: 'Kloak, dræn og regnvand',
    desc: 'Kloaklægning, dræn omkring bygninger og løsninger til regnvandshåndtering.',
    slug: 'kloak-draen',
    label: 'Kloak',
    icon: Droplets,
    x: 59,
    y: 88,
    process: ['Opgravning', 'Rørføring', 'Tilslutning'],
  },
  {
    id: 'indkorsel',
    title: 'Asfalt, fliser og brolægning',
    desc: 'Indkørsler, stier, gårdarealer, fliser og holdbar overfladebehandling.',
    slug: 'asfalt-brolaegning',
    label: 'Indkørsel',
    icon: Layers,
    x: 80,
    y: 86,
    process: ['Bundopbygning', 'Belægning', 'Afretning'],
  },
  {
    id: 'have',
    title: 'Anlæg og udearealer',
    desc: 'Haveanlæg, beplantning, hegn, støttemure, opkantning og udebelægning.',
    slug: 'anlaeg-udearealer',
    label: 'Udeareal',
    icon: Trees,
    x: 18,
    y: 82,
    process: ['Plan', 'Jordarbejde', 'Færdigt udeareal'],
  },
  {
    id: 'grave',
    title: 'Gravearbejde og jordflytning',
    desc: 'Fra spadetagning og ledningsgraving til terrænregulering og større jordarbejde.',
    slug: 'gravearbejde',
    label: 'Gravearbejde',
    icon: HardHat,
    x: 22,
    y: 92,
    process: ['Opmåling', 'Gravning', 'Bortkørsel'],
  },
  {
    id: 'vinter',
    title: 'Snerydding og vinteraftaler',
    desc: 'Snerydning, saltning og grusning for sikre adgangsveje og erhvervsarealer.',
    slug: 'snerydding',
    label: 'Vinter',
    icon: Snowflake,
    x: 14,
    y: 30,
    process: ['Aftale', 'Varsling', 'Rydning'],
  },
  {
    id: 'total',
    title: 'Totalentreprise',
    desc: 'Vi samler fagene og styrer projektet fra grav og fundament til færdig aflevering.',
    slug: 'totalentreprise',
    label: 'Total',
    icon: Home,
    x: 50,
    y: 42,
    process: ['Planlægning', 'Koordinering', 'Aflevering'],
  },
];

function HotspotButton({ hotspot, active, onSelect }) {
  const Icon = hotspot.icon;
  const isActive = active === hotspot.id;
  return (
    <button
      type="button"
      onMouseEnter={() => onSelect(hotspot.id)}
      onFocus={() => onSelect(hotspot.id)}
      onClick={() => onSelect(hotspot.id)}
      className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full border flex items-center justify-center transition shadow-lg ${
        isActive
          ? 'bg-[#d9a17f] border-white text-[#1c1714] scale-110'
          : 'bg-white border-stone-300 text-[#9f5f3b] hover:bg-[#d9a17f] hover:text-[#1c1714]'
      }`}
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
      aria-label={hotspot.title}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export default function InteraktivtHus() {
  const [active, setActive] = useState('total');
  const navigate = useNavigate();
  const current = hotspots.find((h) => h.id === active) || hotspots[0];

  return (
    <section className="py-20 bg-[#1c1714] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(217,161,127,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(217,161,127,0.7) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#d9a17f]/14 border border-[#d9a17f]/30 text-[#f1c4a5] text-sm font-bold mb-4">
              <Info className="w-4 h-4" /> Interaktivt hus
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Tryk på huset og se, hvordan vi samler opgaven
            </h2>
            <p className="text-stone-300 mt-4 leading-relaxed max-w-xl">
              Modellen viser de typiske områder i en bygge- og anlægssag. Vælg et punkt,
              så får kunden hurtigt overblik over ydelsen, processen og næste trin.
            </p>

            <div className="mt-8 bg-stone-50 rounded-lg p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-[#1c1714] flex items-center justify-center flex-shrink-0">
                  <current.icon className="w-6 h-6 text-[#d9a17f]" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-[#9f5f3b] font-black">
                    {current.label}
                  </div>
                  <h3 className="text-2xl font-black text-zinc-950 mt-1">{current.title}</h3>
                  <p className="text-zinc-600 leading-relaxed mt-3">{current.desc}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                {current.process.map((step) => (
                  <div key={step} className="rounded-md border border-stone-200 bg-white p-3">
                    <CheckCircle2 className="w-4 h-4 text-[#9f5f3b]" />
                    <div className="text-sm font-bold text-zinc-900 mt-2">{step}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  to={`/tjenester/${current.slug}`}
                  className="inline-flex items-center gap-2 bg-[#9f5f3b] text-white px-5 py-3 rounded-md font-bold hover:bg-[#7d472c] transition text-sm"
                >
                  Læs mere <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => navigate('/beregn-tilbud')}
                  className="inline-flex items-center gap-2 border border-stone-300 text-zinc-900 px-5 py-3 rounded-md font-bold hover:border-[#9f5f3b] hover:text-[#9f5f3b] transition text-sm"
                >
                  Beregn tilbud <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="relative aspect-[1.18/1] max-w-3xl mx-auto">
              <svg viewBox="0 0 760 640" className="absolute inset-0 w-full h-full drop-shadow-2xl" role="img" aria-label="Interaktiv illustration af hus og byggeplads">
                <defs>
                  <linearGradient id="jd-wall" x1="0" x2="1">
                    <stop offset="0%" stopColor="#f5efe8" />
                    <stop offset="100%" stopColor="#e0c3ad" />
                  </linearGradient>
                  <linearGradient id="jd-roof" x1="0" x2="1">
                    <stop offset="0%" stopColor="#7d472c" />
                    <stop offset="100%" stopColor="#c2835a" />
                  </linearGradient>
                  <linearGradient id="jd-ground" x1="0" x2="1">
                    <stop offset="0%" stopColor="#4a3328" />
                    <stop offset="100%" stopColor="#9f5f3b" />
                  </linearGradient>
                </defs>

                <rect x="50" y="505" width="660" height="82" rx="12" fill="url(#jd-ground)" opacity="0.95" />
                <path d="M92 505 C160 468 225 474 290 505 C370 540 480 460 670 505" fill="#d9a17f" opacity="0.32" />
                <path d="M150 512 L632 512" stroke="#f1c4a5" strokeWidth="5" strokeLinecap="round" strokeDasharray="12 16" opacity="0.65" />

                <path d="M150 275 L380 92 L610 275 Z" fill="url(#jd-roof)" stroke="#f1c4a5" strokeWidth="6" strokeLinejoin="round" />
                <path d="M198 276 H562 V505 H198 Z" fill="url(#jd-wall)" stroke="#f1c4a5" strokeWidth="5" />
                <path d="M248 318 H330 V405 H248 Z M430 318 H512 V405 H430 Z" fill="#fffaf5" stroke="#9f5f3b" strokeWidth="5" />
                <path d="M289 318 V405 M248 361 H330 M471 318 V405 M430 361 H512" stroke="#c2835a" strokeWidth="3" />
                <path d="M356 380 H408 V505 H356 Z" fill="#5b3828" stroke="#9f5f3b" strokeWidth="5" />
                <circle cx="396" cy="446" r="5" fill="#d9a17f" />
                <rect x="180" y="488" width="400" height="24" fill="#7d472c" opacity="0.9" />

                <path d="M105 534 C115 490 166 493 176 534" fill="#40583f" stroke="#d9a17f" strokeWidth="3" />
                <path d="M106 534 H178" stroke="#d9a17f" strokeWidth="3" />
                <path d="M610 498 L700 566 L520 566 Z" fill="#37302b" stroke="#d9a17f" strokeWidth="4" />
                <path d="M632 520 H674 M646 536 H688 M602 552 H644" stroke="#766052" strokeWidth="2" />
                <path d="M270 552 C346 568 430 568 508 552" fill="none" stroke="#68a2b9" strokeWidth="7" strokeLinecap="round" strokeDasharray="18 14" />
                <circle cx="386" cy="552" r="12" fill="#1c1714" stroke="#68a2b9" strokeWidth="5" />

                <g opacity="0.9">
                  <path d="M54 575 L154 575 L118 535 L83 535 Z" fill="#6b4b3d" stroke="#d9a17f" strokeWidth="3" />
                  <circle cx="82" cy="578" r="10" fill="#1c1714" />
                  <circle cx="130" cy="578" r="10" fill="#1c1714" />
                  <path d="M120 535 L154 510 L168 520 L138 547" fill="none" stroke="#d9a17f" strokeWidth="5" strokeLinecap="round" />
                </g>
              </svg>

              {hotspots.map((hotspot) => (
                <HotspotButton
                  key={hotspot.id}
                  hotspot={hotspot}
                  active={active}
                  onSelect={setActive}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {hotspots.map((hotspot) => (
                <button
                  key={hotspot.id}
                  type="button"
                  onClick={() => setActive(hotspot.id)}
                  className={`text-xs sm:text-sm px-3 py-2 rounded-md border font-semibold transition ${
                    active === hotspot.id
                      ? 'bg-[#d9a17f] border-[#d9a17f] text-[#1c1714]'
                      : 'bg-white/8 border-white/14 text-stone-200 hover:bg-white/14'
                  }`}
                >
                  {hotspot.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
