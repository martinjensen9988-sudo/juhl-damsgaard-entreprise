import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Building2, LogOut, HardHat, Calculator, LayoutDashboard, Home, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AnimatedOutlet from '@/components/AnimatedOutlet';

export default function PortalLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-slate-950 text-white sticky top-0 z-30 safe-pt">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between safe-px">
          <Link to="/portal" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="font-bold leading-none">Juhl & Damsgaard</div>
              <div className="text-xs text-slate-400 mt-0.5">Kundeportal</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Link to="/dashboard" className="text-sm text-amber-400 hover:text-amber-300 font-medium">Admin panel</Link>
            )}
            <button
              onClick={() => base44.auth.logout('/login')}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
            >
              <LogOut className="w-4 h-4" /> Log ud
            </button>
          </div>
        </div>
      </header>
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          <NavLink to="/portal" className={({isActive}) => `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-amber-400 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            <HardHat className="w-4 h-4" /> Mine Projekter
          </NavLink>
          <NavLink to="/prisberegner" className={({isActive}) => `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-amber-400 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            <Calculator className="w-4 h-4" /> Prisberegner
          </NavLink>
          <NavLink to="/kunde-forside" className={({isActive}) => `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-amber-400 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            <Home className="w-4 h-4" /> Forside
          </NavLink>
          <NavLink to="/kunde-dashboard" className={({isActive}) => `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-amber-400 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </NavLink>
          <NavLink to="/portal/tilfredshed" className={({isActive}) => `flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-amber-400 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            <Heart className="w-4 h-4" /> Feedback
          </NavLink>
        </div>
      </div>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatedOutlet />
      </main>
    </div>
  );
}