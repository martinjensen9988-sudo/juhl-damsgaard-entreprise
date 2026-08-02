import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';

export default function ForsideLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-bold text-white tracking-tight">Juhl & Damsgaard</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <Link to="/tjenester" className="hover:text-amber-400 transition">Tjenester</Link>
            <Link to="/beregn-tilbud" className="hover:text-amber-400 transition">Prisberegner</Link>
            <Link to="/om-os" className="hover:text-amber-400 transition">Om os</Link>
            <Link to="/kontakt" className="hover:text-amber-400 transition">Kontakt</Link>
          </div>
          <Link to="/login" className="text-sm font-medium text-slate-950 bg-amber-400 px-4 py-2 rounded-lg hover:bg-amber-300 transition">
            Log ind
          </Link>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

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