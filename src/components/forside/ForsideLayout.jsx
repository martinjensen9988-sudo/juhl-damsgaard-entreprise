import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { BRAND_LOGO_URL } from '@/lib/brand';
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
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Image src={BRAND_LOGO_URL} fittingType="fit" className="h-9 w-9 rounded-lg overflow-hidden bg-white flex-shrink-0" alt="Juhl & Damsgaard Entreprise logo" />
            <span className="font-bold text-white tracking-tight">Juhl & Damsgaard</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-amber-400 transition">{l.label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' ? (
              <Link to="/dashboard" className="hidden sm:inline-flex text-sm font-medium text-slate-950 bg-amber-400 px-4 py-2 rounded-lg hover:bg-amber-300 transition">
                Admin panel
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-slate-950 bg-amber-400 px-4 py-2 rounded-lg hover:bg-amber-300 transition">
                Log ind
              </Link>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-slate-800 transition"
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobil-menu */}
        {open && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950">
            <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-sm text-slate-200 hover:text-amber-400 transition border-b border-slate-800/60 last:border-0"
                >
                  {l.label}
                </Link>
              ))}
              {user?.role === 'admin' ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="mt-2 inline-flex justify-center text-sm font-medium text-slate-950 bg-amber-400 px-4 py-2.5 rounded-lg hover:bg-amber-300 transition">
                  Admin panel
                </Link>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="mt-2 inline-flex justify-center text-sm font-medium text-slate-950 bg-amber-400 px-4 py-2.5 rounded-lg hover:bg-amber-300 transition">
                  Log ind
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src={BRAND_LOGO_URL} fittingType="fit" className="h-7 w-7 rounded bg-white overflow-hidden flex-shrink-0" alt="Juhl & Damsgaard Entreprise logo" />
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