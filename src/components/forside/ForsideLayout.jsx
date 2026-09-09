import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Phone, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { BRAND_EMAIL, BRAND_LOGO_URL, BRAND_PHONE_DISPLAY, BRAND_PHONE_LINK } from '@/lib/brand';
import { base44 } from '@/api/base44Client';

const navLinks = [
  { to: '/tjenester', label: 'Tjenester' },
  { to: '/beregn-tilbud', label: 'Prisberegner' },
  { to: '/om-os', label: 'Om os' },
  { to: '/faq', label: 'FAQ' },
  { to: '/kontakt', label: 'Kontakt' },
];

export default function ForsideLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-zinc-950">
      <nav className="fixed top-0 inset-x-0 z-50 bg-stone-50 border-b border-stone-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <Image src={BRAND_LOGO_URL} fittingType="fit" className="h-12 w-12 rounded-md overflow-hidden bg-white ring-1 ring-stone-200 flex-shrink-0" alt="Juhl & Damsgaard Entreprise logo" />
            <span className="min-w-0">
              <span className="block font-black text-zinc-950 tracking-tight leading-tight truncate">Juhl & Damsgaard</span>
              <span className="block text-[11px] uppercase tracking-[0.22em] text-[#9f5f3b] font-semibold">Entreprise</span>
            </span>
          </Link>
          <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-zinc-700">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-[#9f5f3b] transition">{l.label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a href={`tel:${BRAND_PHONE_LINK}`} className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 border border-stone-300 px-4 py-2 rounded-md hover:border-[#9f5f3b] hover:text-[#9f5f3b] transition">
              <Phone className="w-4 h-4" /> {BRAND_PHONE_DISPLAY}
            </a>
            {user?.role === 'admin' ? (
              <Link to="/dashboard" className="hidden sm:inline-flex text-sm font-semibold text-white bg-[#9f5f3b] px-4 py-2 rounded-md hover:bg-[#7d472c] transition">
                Admin panel
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex text-sm font-semibold text-white bg-[#9f5f3b] px-4 py-2 rounded-md hover:bg-[#7d472c] transition">
                Log ind
              </Link>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-zinc-950 hover:bg-stone-200 transition"
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobil-menu */}
        {open && (
          <div className="lg:hidden border-t border-stone-200 bg-stone-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-sm font-medium text-zinc-800 hover:text-[#9f5f3b] transition border-b border-stone-200 last:border-0"
                >
                  {l.label}
                </Link>
              ))}
              {user?.role === 'admin' ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="mt-2 inline-flex justify-center text-sm font-semibold text-white bg-[#9f5f3b] px-4 py-2.5 rounded-md hover:bg-[#7d472c] transition">
                  Admin panel
                </Link>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="mt-2 inline-flex justify-center text-sm font-semibold text-white bg-[#9f5f3b] px-4 py-2.5 rounded-md hover:bg-[#7d472c] transition">
                  Log ind
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#1c1714] border-t border-[#3b2b23] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Image src={BRAND_LOGO_URL} fittingType="fit" className="h-10 w-10 rounded-md bg-white overflow-hidden flex-shrink-0" alt="Juhl & Damsgaard Entreprise logo" />
            <span className="font-bold text-white">Juhl & Damsgaard Entreprise</span>
          </div>
          <div className="text-sm text-stone-400">© 2026 Juhl & Damsgaard Entreprise. Alle rettigheder forbeholdt.</div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-stone-300">
            <a href={`tel:${BRAND_PHONE_LINK}`} className="hover:text-[#d9a17f] transition">{BRAND_PHONE_DISPLAY}</a>
            <a href={`mailto:${BRAND_EMAIL}`} className="hover:text-[#d9a17f] transition">{BRAND_EMAIL}</a>
            <Link to="/portal" className="hover:text-[#d9a17f] transition">Kundeportal</Link>
            <Link to="/login" className="hover:text-[#d9a17f] transition">Log ind</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
