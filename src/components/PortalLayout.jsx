import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building2, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PortalLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="font-bold leading-none">BygStyring</div>
              <div className="text-xs text-slate-400 mt-0.5">Kundeportal</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Link to="/" className="text-sm text-slate-300 hover:text-white">Admin</Link>
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}