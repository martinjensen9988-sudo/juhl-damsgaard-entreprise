import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  HardHat,
  FileText,
  Receipt,
  Building2,
  Package,
  Clock,
  Truck,
  Activity,
  Settings,
  ExternalLink,
  Images,
  Contact,
  Archive,
  Target,
  CalendarDays,
  BarChart3,
  RefreshCw,
  ClipboardList,
  ShieldCheck,
  FileSpreadsheet,
  PieChart,
  Sparkles,
  Plug,
  Wrench,
  Filter,
  Milestone,
  Headphones,
  ShoppingCart,
  Eye,
  Award,
  FolderOpen,
  BookOpen,
  ListChecks,
  UserSearch,
  BarChart2,
  CalendarClock,
  CalendarPlus,
  ShieldAlert,
  Repeat,
  History,
  AlertOctagon,
  Settings2,
  Users2,
  UserCog,
  Monitor,
  Tv,
  Car,
  Briefcase,
  HelpCircle,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/salgsoverblik', label: 'Salg', icon: Target },
  { to: '/kunder', label: 'Kunder', icon: Users },
  { to: '/projekter', label: 'Projekter', icon: HardHat },
  { to: '/tilbud', label: 'Tilbud', icon: FileText },
  { to: '/faktura', label: 'Faktura', icon: Receipt },
  { to: '/planlaegning', label: 'Planlægning', icon: CalendarDays },
  { to: '/materialeliste', label: 'Materialer', icon: Package },
  { to: '/tidsregistrering', label: 'Tid', icon: Clock },
  { to: '/leverandoerer', label: 'Leverandører', icon: Truck },
  { to: '/projektstatus', label: 'Projektstatus', icon: Activity },
  { to: '/indstillinger', label: 'Indstillinger', icon: Settings },
  { to: '/projekt-galleri', label: 'Galleri', icon: Images },
  { to: '/medarbejdere', label: 'Medarbejdere', icon: Contact },
  { to: '/dokumenter', label: 'Dokumenter', icon: Archive },
  { to: '/serviceaftaler', label: 'Serviceaftaler', icon: RefreshCw },
  { to: '/ledelsesoverblik', label: 'Ledelse', icon: BarChart3 },
  { to: '/arbejdssedler', label: 'Arbejdssedler', icon: ClipboardList },
  { to: '/kvalitetssikring', label: 'Kvalitet', icon: ShieldCheck },
  { to: '/regnskab', label: 'Regnskab', icon: FileSpreadsheet },
  { to: '/daekningsbidrag', label: 'Dækningsbidrag', icon: PieChart },
  { to: '/regnskab-integration', label: 'Regnskab int.', icon: Plug },
  { to: '/ai-tilbud', label: 'AI Tilbud', icon: Sparkles },
  { to: '/ugeplanlaegning', label: 'Ugeplan', icon: CalendarDays },
  { to: '/materiel', label: 'Materiel', icon: Wrench },
  { to: '/salgs-pipeline', label: 'Pipeline', icon: Filter },
  { to: '/projekt-milepaele', label: 'Milepæle', icon: Milestone },
  { to: '/kundesupport', label: 'Support', icon: Headphones },
  { to: '/materialeindkoeb', label: 'Indkøb', icon: ShoppingCart },
  { to: '/projektoverblik', label: 'Overblik', icon: Eye },
  { to: '/certifikater', label: 'Certifikater', icon: Award },
  { to: '/virksomhedsindstillinger', label: 'Firmaoplysninger', icon: Building2 },
  { to: '/dokumentarkiv', label: 'Dokumentarkiv', icon: FolderOpen },
  { to: '/servicekatalog', label: 'Servicekatalog', icon: BookOpen },
  { to: '/opgaveliste', label: 'Opgaveliste', icon: ListChecks },
  { to: '/kundeoversigt', label: 'Kundeoversigt', icon: UserSearch },
  { to: '/kundestatistik', label: 'Kundestatistik', icon: BarChart2 },
  { to: '/udloebs-oversigt', label: 'Udløbsdatoer', icon: CalendarClock },
  { to: '/materiel-booking', label: 'Værktøjsbooking', icon: CalendarPlus },
  { to: '/sikkerhedslog', label: 'Sikkerhedslog', icon: ShieldAlert },
  { to: '/abonnementer', label: 'Abonnementer', icon: Repeat },
  { to: '/indkoebsordrer', label: 'Indkøbsordrer', icon: ClipboardList },
  { to: '/aktivitetslog', label: 'Aktivitetslog', icon: History },
  { to: '/afvigelser', label: 'Afvigelser', icon: AlertOctagon },
  { to: '/kundeportal-indstillinger', label: 'Portal-styring', icon: Settings2 },
  { to: '/ressourceallokering', label: 'Ressource', icon: Users2 },
  { to: '/noegletal', label: 'Nøgletal', icon: PieChart },
  { to: '/medarbejder-administration', label: 'Medarb.admin', icon: UserCog },
  { to: '/kvalitetsstyring', label: 'Kvalitetsstyring', icon: ShieldCheck },
  { to: '/vaerksted', label: 'Værksted', icon: Wrench },
  { to: '/storskaerm', label: 'Storskærm', icon: Monitor },
  { to: '/infotaavle', label: 'Info-skærm', icon: Tv },
  { to: '/bilpark', label: 'Bilpark', icon: Car },
  { to: '/underentreprenoerer', label: 'Underentreprenører', icon: Briefcase },
  { to: '/vidensbase', label: 'Vidensbase', icon: HelpCircle },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-950 text-slate-300 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
            <Building2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="font-bold text-white tracking-tight leading-none">BygStyring</div>
            <div className="text-xs text-slate-500 mt-1">Entreprenørledelse</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-2">
          <a href="/portal" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-slate-800/60 transition-all">
            <ExternalLink className="w-[18px] h-[18px]" />
            Kundeportal
          </a>
        </div>
        <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-600">
          © 2026 BygStyring
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-950 text-white px-4 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-slate-950" />
        </div>
        <span className="font-bold tracking-tight">BygStyring</span>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden sticky top-[52px] z-20 bg-white border-b flex overflow-x-auto px-2 py-2 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive ? 'bg-slate-950 text-amber-400' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <div className="md:ml-64">
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}