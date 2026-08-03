import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';

// Interaktiv arkitekttegnet hus — klik på en del for at se tilhørende tjeneste
// Del af Juhl & Damsgaard Entreprise forside-HUD

const hotspots = [
  {
    id: 'tag',
    title: 'Snerydding',
    desc: 'Vi holder taget og arealerne fri for sne og is hele vinteren.',
    slug: 'snerydding',
    label: 'Tag',
  },
  {
    id: 'vinduer',
    title: 'Skadeservice',
    desc: 'Akut hjælp ved vandskade, stormskade og frostskade.',
    slug: 'skadeservice',
    label: 'Vinduer',
  },
  {
    id: 'dor',
    title: 'Vicevært service',
    desc: 'Løbende tilsyn, vedligehold og småreparationer.',
    slug: 'vicevaert-service',
    label: 'Dør',
  },
  {
    id: 'fundament',
    title: 'Beton & Støbning',
    desc: 'Fundamenter, sokler og betonarbejde der holder.',
    slug: 'beton-stobning',
    label: 'Fundament',
  },
  {
    id: 'grave',
    title: 'Gravearbejde',
    desc: 'Alt gravearbejde — fra spadetagning til store jordflytninger.',
    slug: 'gravearbejde',
    label: 'Grund',
  },
  {
    id: 'kloak',
    title: 'Kloak & Dræn',
    desc: 'Kloaklægning, drænløsninger og regnvandshåndtering.',
    slug: 'kloak-draen',
    label: 'Kloak',
  },
  {
    id: 'indkorsel',
    title: 'Asfalt & Brolægning',
    desc: 'Asfalt, brolægning og flisearbejde med holdbart resultat.',
    slug: 'asfalt-brolaegning',
    label: 'Indkørsel',
  },
  {
    id: 'have',
    title: 'Anlæg & Udearealer',
    desc: 'Haveanlæg, beplantning og hegn skræddersyet til dig.',
    slug: 'anlaeg-udearealer',
    label: 'Have',
  },
];

export default function InteraktivtHus() {
  const [active, setActive] = useState(null);
  const navigate = useNavigate();
  const current = hotspots.find((h) => h.id === active);
  const goTo = (slug) => navigate(`/tjenester/${slug}`);

  return (
    <section className="py-16 bg-slate-950 relative overflow-hidden">
      {/* Blueprint-gitter */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-medium mb-4">
            <Info className="w-4 h-4" /> Interaktivt hus
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Tryk på huset — se hvad vi løser
          </h2>
          <p className="text-slate-400 mt-3 leading-relaxed">
            Klik på en del af tegningen for at læse om den tilhørende tjeneste.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-center">
          {/* Hus-tegning */}
          <div className="lg:col-span-3">
            <svg
              viewBox="0 0 600 420"
              className="w-full h-auto"
              style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.4))' }}
            >
              {/* Jordlinje */}
              <line x1="20" y1="330" x2="580" y2="330" stroke="#475569" strokeWidth="1.5" strokeDasharray="6 4" />

              {/* Tag — klikbar */}
              <g
                onMouseEnter={() => setActive('tag')}
                onMouseLeave={() => setActive(null)}
                onClick={() => goTo('snerydding')}
                className="cursor-pointer"
              >
                <polygon
                  points="300,40 110,180 490,180"
                  fill={active === 'tag' ? 'rgba(251,191,36,0.10)' : 'transparent'}
                  stroke={active === 'tag' ? '#fbbf24' : '#94a3b8'}
                  strokeWidth={active === 'tag' ? 2.5 : 1.5}
                  className="transition-all"
                />
                <line x1="300" y1="40" x2="300" y2="180" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                {/* Snemarker på taget */}
                <polygon points="170,150 300,80 430,150" fill="rgba(255,255,255,0.06)" stroke="none" />
              </g>

              {/* Huskrop */}
              <g
                onMouseEnter={() => setActive('fundament')}
                onMouseLeave={() => setActive(null)}
                onClick={() => goTo('beton-stobning')}
                className="cursor-pointer"
              >
                <rect
                  x="150" y="180" width="300" height="150"
                  fill={active === 'fundament' ? 'rgba(251,191,36,0.10)' : 'transparent'}
                  stroke={active === 'fundament' ? '#fbbf24' : '#94a3b8'}
                  strokeWidth={active === 'fundament' ? 2.5 : 1.5}
                  className="transition-all"
                />
                {/* Sokkel-markering */}
                <rect x="150" y="315" width="300" height="15" fill="rgba(148,163,184,0.08)" stroke="#64748b" strokeWidth="1" />
              </g>

              {/* Vindue venstre — klikbar */}
              <g
                onMouseEnter={() => setActive('vinduer')}
                onMouseLeave={() => setActive(null)}
                onClick={() => goTo('skadeservice')}
                className="cursor-pointer"
              >
                <rect
                  x="180" y="210" width="70" height="70"
                  fill={active === 'vinduer' ? 'rgba(251,191,36,0.12)' : 'rgba(148,163,184,0.05)'}
                  stroke={active === 'vinduer' ? '#fbbf24' : '#94a3b8'}
                  strokeWidth={active === 'vinduer' ? 2.5 : 1.5}
                  className="transition-all"
                />
                <line x1="215" y1="210" x2="215" y2="280" stroke="#64748b" strokeWidth="1" />
                <line x1="180" y1="245" x2="250" y2="245" stroke="#64748b" strokeWidth="1" />
              </g>

              {/* Vindue højre — klikbar (samme gruppe-koncept) */}
              <g
                onMouseEnter={() => setActive('vinduer')}
                onMouseLeave={() => setActive(null)}
                onClick={() => goTo('skadeservice')}
                className="cursor-pointer"
              >
                <rect
                  x="350" y="210" width="70" height="70"
                  fill={active === 'vinduer' ? 'rgba(251,191,36,0.12)' : 'rgba(148,163,184,0.05)'}
                  stroke={active === 'vinduer' ? '#fbbf24' : '#94a3b8'}
                  strokeWidth={active === 'vinduer' ? 2.5 : 1.5}
                  className="transition-all"
                />
                <line x1="385" y1="210" x2="385" y2="280" stroke="#64748b" strokeWidth="1" />
                <line x1="350" y1="245" x2="420" y2="245" stroke="#64748b" strokeWidth="1" />
              </g>

              {/* Dør — klikbar */}
              <g
                onMouseEnter={() => setActive('dor')}
                onMouseLeave={() => setActive(null)}
                onClick={() => goTo('vicevaert-service')}
                className="cursor-pointer"
              >
                <rect
                  x="280" y="240" width="40" height="90"
                  fill={active === 'dor' ? 'rgba(251,191,36,0.12)' : 'transparent'}
                  stroke={active === 'dor' ? '#fbbf24' : '#94a3b8'}
                  strokeWidth={active === 'dor' ? 2.5 : 1.5}
                  className="transition-all"
                />
                <circle cx="312" cy="285" r="2.5" fill="#94a3b8" />
              </g>

              {/* Indkørsel — klikbar */}
              <g
                onMouseEnter={() => setActive('indkorsel')}
                onMouseLeave={() => setActive(null)}
                onClick={() => goTo('asfalt-brolaegning')}
                className="cursor-pointer"
              >
                <polygon
                  points="280,330 320,330 380,400 220,400"
                  fill={active === 'indkorsel' ? 'rgba(251,191,36,0.10)' : 'rgba(148,163,184,0.06)'}
                  stroke={active === 'indkorsel' ? '#fbbf24' : '#94a3b8'}
                  strokeWidth={active === 'indkorsel' ? 2.5 : 1.5}
                  className="transition-all"
                />
                {/* Brolægningslinjer */}
                {[350, 360, 370, 380, 390].map((y) => (
                  <line key={y} x1={280 + (y - 330) * 0.7} y1={y} x2={320 + (y - 330) * 0.7} y2={y} stroke="#64748b" strokeWidth="0.8" />
                ))}
              </g>

              {/* Have — klikbar (venstre side) */}
              <g
                onMouseEnter={() => setActive('have')}
                onMouseLeave={() => setActive(null)}
                onClick={() => goTo('anlaeg-udearealer')}
                className="cursor-pointer"
              >
                <path
                  d="M 40 330 Q 70 290 100 330 Q 130 300 140 330 Z"
                  fill={active === 'have' ? 'rgba(251,191,36,0.10)' : 'rgba(34,197,94,0.06)'}
                  stroke={active === 'have' ? '#fbbf24' : '#94a3b8'}
                  strokeWidth={active === 'have' ? 2.5 : 1.5}
                  className="transition-all"
                />
                {/* Busk */}
                <circle cx="70" cy="312" r="3" fill="#475569" />
                <circle cx="85" cy="318" r="3" fill="#475569" />
              </g>

              {/* Kloakledning — klikbar (under jorden) */}
              <g
                onMouseEnter={() => setActive('kloak')}
                onMouseLeave={() => setActive(null)}
                onClick={() => goTo('kloak-draen')}
                className="cursor-pointer"
              >
                <path
                  d="M 150 360 L 450 360"
                  stroke={active === 'kloak' ? '#fbbf24' : '#94a3b8'}
                  strokeWidth={active === 'kloak' ? 3 : 2}
                  strokeDasharray="10 6"
                  className="transition-all"
                  fill="none"
                />
                <circle cx="300" cy="360" r="6" fill={active === 'kloak' ? 'rgba(251,191,36,0.2)' : 'transparent'} stroke={active === 'kloak' ? '#fbbf24' : '#64748b'} strokeWidth="1.5" />
              </g>

              {/* Grave-zone — klikbar (hele grund) */}
              <g
                onMouseEnter={() => setActive('grave')}
                onMouseLeave={() => setActive(null)}
                onClick={() => goTo('gravearbejde')}
                className="cursor-pointer"
              >
                <rect
                  x="30" y="330" width="540" height="70"
                  fill={active === 'grave' ? 'rgba(251,191,36,0.08)' : 'transparent'}
                  stroke={active === 'grave' ? '#fbbf24' : 'transparent'}
                  strokeWidth="2"
                  className="transition-all"
                  rx="4"
                />
                {/* Grave-symboler */}
                <path d="M 460 360 l 8 -8 l 8 8 l -8 8 Z" fill="none" stroke="#64748b" strokeWidth="1" />
                <path d="M 490 358 l 6 -6 l 6 6" fill="none" stroke="#64748b" strokeWidth="1" />
              </g>

              {/* Målepunkter (arkitekt-detajler) */}
              <g stroke="#475569" strokeWidth="0.8" fill="none">
                <line x1="150" y1="30" x2="450" y2="30" />
                <line x1="150" y1="25" x2="150" y2="35" />
                <line x1="450" y1="25" x2="450" y2="35" />
              </g>
              <text x="300" y="22" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">15.0 m</text>
            </svg>
          </div>

          {/* Info-panel */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6 min-h-[280px] backdrop-blur-sm">
              {current ? (
                <div className="animate-in fade-in">
                  <div className="text-xs uppercase tracking-wider text-amber-400 font-medium mb-2">
                    {current.label}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{current.title}</h3>
                  <p className="text-slate-300 leading-relaxed mb-6">{current.desc}</p>
                  <Link
                    to={`/tjenester/${current.slug}`}
                    className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-5 py-2.5 rounded-lg font-semibold hover:bg-amber-300 transition text-sm"
                  >
                    Læs mere <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-full py-10">
                  <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4">
                    <Info className="w-6 h-6 text-amber-400" />
                  </div>
                  <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                    Hold musen over — eller klik på — en del af huset for at se, hvad vi kan hjælpe med.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-xs">
                    {hotspots.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => goTo(h.slug)}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-amber-400/10 hover:border-amber-400/30 hover:text-amber-400 transition"
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}