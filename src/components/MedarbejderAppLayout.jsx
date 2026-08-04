import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Home, Clock, ListChecks, MessageSquare, User, LogOut, HardHat, Bell, Receipt } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BRAND_NAME_SHORT } from '@/lib/brand';
import { useMaNotifications } from '@/hooks/useMaNotifications';

const NAV = [
  { to: '/app', label: 'Hjem', icon: Home, end: true },
  { to: '/app/tid', label: 'Tid', icon: Clock },
  { to: '/app/opgaver', label: 'Opgaver', icon: ListChecks, badgeKey: 'tasks' },
  { to: '/app/beskeder', label: 'Beskeder', icon: MessageSquare, badgeKey: 'messages' },
  { to: '/app/bilag', label: 'Bilag', icon: Receipt },
  { to: '/app/profil', label: 'Profil', icon: User },
];

export default function MedarbejderAppLayout() {
  const [user, setUser] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const { unreadMessages, unreadTasks, markMessagesRead, markTasksRead, requestPermission, permission } = useMaNotifications();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    setClockedIn(!!localStorage.getItem('ma_clock_start'));
  }, []);

  const syncClock = () => {
    const start = localStorage.getItem('ma_clock_start');
    setClockedIn(!!start);
    window.dispatchEvent(new Event('ma-clock-change'));
  };

  useEffect(() => {
    const handler = () => {
      const start = localStorage.getItem('ma_clock_start');
      setClockedIn(!!start);
    };
    window.addEventListener('ma-clock-change', handler);
    return () => window.removeEventListener('ma-clock-change', handler);
  }, []);

  const badges = { tasks: unreadTasks, messages: unreadMessages };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-md mx-auto shadow-xl relative">
      {/* Top bar */}
      <header className="bg-slate-950 text-white sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="font-bold leading-none text-sm">{BRAND_NAME_SHORT}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Medarbejder-app</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {permission === 'default' && (
            <button onClick={requestPermission} title="Aktivér notifikationer" className="text-amber-400">
              <Bell className="w-4 h-4" />
            </button>
          )}
          <span className={`flex items-center gap-1.5 text-xs font-medium ${clockedIn ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-2 h-2 rounded-full ${clockedIn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {clockedIn ? 'På arbejde' : 'Ikke tjekket ind'}
          </span>
          <button onClick={() => base44.auth.logout('/login')} className="text-slate-300 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet context={{ user, syncClock, clockedIn, markMessagesRead, markTasksRead }} />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-950 border-t border-slate-800 z-40">
        <div className="flex">
          {NAV.map(({ to, label, icon: Icon, end, badgeKey }) => {
            const count = badgeKey ? badges[badgeKey] : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors relative ${
                    isActive ? 'text-amber-400' : 'text-slate-400'
                  }`
                }
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                {label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}