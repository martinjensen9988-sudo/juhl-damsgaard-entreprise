import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { BRAND_LOGO_URL } from '@/lib/brand';
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
  Wrench,
  Filter,
  Milestone,
  Headphones,
  ShoppingCart,
  Award,
  Files,
  Warehouse,
  Recycle,
  Palmtree,
  Calculator,
  UserRound,
  Timer,
  FileCheck,
  Star,
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
  MapPin,
  HelpCircle,
  PenLine,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';

const primaryItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
];

const navGroups = [
  {
    label: 'Salg & Tilbud',
    icon: Target,
    items: [
      { to: '/salgsoverblik', label: 'Salgsoverblik', icon: BarChart3 },
      { to: '/tilbud', label: 'Tilbud', icon: FileText },
      { to: '/ai-tilbud', label: 'AI Tilbud', icon: Sparkles },
      { to: '/salgs-pipeline', label: 'Salgs Pipeline', icon: Filter },
    ],
  },
  {
    label: 'Kunder',
    icon: Users,
    items: [
      { to: '/kunder', label: 'Kunder', icon: Users },
      { to: '/kundetilfredshed', label: 'Kundetilfredshed', icon: Star },
      { to: '/kundesupport', label: 'Kundesupport', icon: Headphones },
      { to: '/kundearkiv', label: 'Kundearkiv', icon: Archive },
    ],
  },
  {
    label: 'Projekter',
    icon: HardHat,
    items: [
      { to: '/projekter', label: 'Projekter', icon: HardHat },
      { to: '/projektstatus', label: 'Projektstatus', icon: Activity },
      { to: '/projekt-arkiv', label: 'Projektarkiv', icon: Files },
      { to: '/projekt-oekonomi', label: 'Projektøkonomi', icon: Calculator },
      { to: '/projektkalender', label: 'Projektkalender', icon: CalendarDays },
      { to: '/projekt-milepaele', label: 'Milepæle', icon: Milestone },
      { to: '/projekt-tidslinje', label: 'Projekttidslinje', icon: Milestone },
      { to: '/drifts-logbog', label: 'Driftslogbog', icon: ClipboardList },
    ],
  },
  {
    label: 'Økonomi',
    icon: FileSpreadsheet,
    items: [
      { to: '/faktura', label: 'Fakturaer', icon: Receipt },
      { to: '/faktura-arkiv', label: 'Fakturaarkiv', icon: Archive },
      { to: '/regnskab', label: 'Regnskab', icon: FileSpreadsheet },
      { to: '/daekningsbidrag', label: 'Dækningsbidrag', icon: PieChart },
      { to: '/leverandoerfakturaer', label: 'Leverandørfakturaer', icon: FileCheck },
      { to: '/udgiftsstyring', label: 'Udgiftsstyring', icon: Receipt },
      { to: '/udlaegsstyring', label: 'Udlæg', icon: Receipt },
      { to: '/oekonomi-rapport', label: 'Økonomirapport', icon: BarChart3 },
    ],
  },
  {
    label: 'Planlægning',
    icon: CalendarDays,
    items: [
      { to: '/planlaegning', label: 'Planlægning', icon: CalendarDays },
      { to: '/ugeplanlaegning', label: 'Ugeplan', icon: CalendarDays },
      { to: '/vagtplan', label: 'Vagtplan', icon: CalendarClock },
      { to: '/vejr-planlaegning', label: 'Vejr & planlægning', icon: CalendarDays },
      { to: '/moede-booking', label: 'Mødebooker', icon: CalendarPlus },
      { to: '/ressourceallokering', label: 'Ressource', icon: Users2 },
      { to: '/moede-kalender', label: 'Mødekalender', icon: CalendarPlus },
    ],
  },
  {
    label: 'Opgaver',
    icon: ClipboardList,
    items: [
      { to: '/opgaveliste', label: 'Opgaveliste', icon: ClipboardList },
      { to: '/arbejdssedler', label: 'Arbejdssedler', icon: ClipboardList },
    ],
  },
  {
    label: 'Materialer & Lager',
    icon: Package,
    items: [
      { to: '/materialeliste', label: 'Materialer', icon: Package },
      { to: '/materialeindkoeb', label: 'Indkøb', icon: ShoppingCart },
      { to: '/lager-styring', label: 'Lagerstyring', icon: Warehouse },
      { to: '/materiale-lager', label: 'Materialelager', icon: Package },
      { to: '/materiel-lokationer', label: 'Materiellokationer', icon: MapPin },
    ],
  },
  {
    label: 'Materiel & Udstyr',
    icon: Wrench,
    items: [
      { to: '/materiel', label: 'Materiel', icon: Wrench },
      { to: '/udstyrskalender', label: 'Udstyrskalender', icon: CalendarDays },
      { to: '/vaerktoej-service', label: 'Værktøjsservice', icon: Wrench },
      { to: '/materiel-logistik', label: 'Materiellogistik', icon: Truck },
      { to: '/vaerksted', label: 'Værksted', icon: Wrench },
      { to: '/bilpark', label: 'Bilpark', icon: Car },
      { to: '/udstyrs-historik', label: 'Udstyrshistorik', icon: History },
    ],
  },
  {
    label: 'Medarbejdere',
    icon: Contact,
    items: [
      { to: '/medarbejdere', label: 'Medarbejdere', icon: Contact },
      { to: '/medarbejder-arkiv', label: 'Medarbejderarkiv', icon: Contact },
      { to: '/medarbejder-cv', label: 'Medarbejder-CV', icon: Award },
      { to: '/personale-oversigt', label: 'Personaleoversigt', icon: Users },
      { to: '/medarbejder-administration', label: 'Administration', icon: UserCog },
      { to: '/ferie-administration', label: 'Ferie', icon: Palmtree },
      { to: '/tidsregistrering', label: 'Tidsregistrering', icon: Clock },
      { to: '/tidskalender', label: 'Tidskalender', icon: CalendarDays },
      { to: '/timeseddel-rapport', label: 'Timeseddel', icon: Timer },
      { to: '/brugerprofil', label: 'Brugerprofil', icon: UserRound },
      { to: '/kursusstyring', label: 'Kursusstyring', icon: GraduationCap },
      { to: '/bruger-administration', label: 'Brugeradministration', icon: UserCog },
      { to: '/medarbejder-beskeder', label: 'Medarbejderbeskeder', icon: MessageSquare },
    ],
  },
  {
    label: 'Leverandører',
    icon: Truck,
    items: [
      { to: '/leverandoerer', label: 'Leverandører', icon: Truck },
      { to: '/underentreprenoerer', label: 'Underentreprenører', icon: Briefcase },
      { to: '/underleverandoer-portal', label: 'Underleverandør-portal', icon: Briefcase },
      { to: '/samarbejdspartnere', label: 'Samarbejdspartnere', icon: Users2 },
    ],
  },
  {
    label: 'Kvalitet & Sikkerhed',
    icon: ShieldCheck,
    items: [
      { to: '/kvalitetssikring', label: 'Kvalitet', icon: ShieldCheck },
      { to: '/sikkerhedslog', label: 'Sikkerhedslog', icon: ShieldAlert },
      { to: '/afvigelser', label: 'Afvigelser', icon: AlertOctagon },
      { to: '/sikkerheds-tjekliste', label: 'Sikkerheds-tjekliste', icon: ClipboardCheck },
      { to: '/mangel-liste', label: 'Mangel-oversigt', icon: AlertOctagon },
      { to: '/kvalitetsstyring-oversigt', label: 'Kvalitetsoversigt', icon: ShieldCheck },
    ],
  },
  {
    label: 'Miljø & Affald',
    icon: Recycle,
    items: [
      { to: '/miljoe-affald', label: 'Miljø & Affald', icon: Recycle },
      { to: '/asbestfjernelse', label: 'Asbest', icon: ShieldAlert },
      { to: '/forsikringssager', label: 'Forsikringssager', icon: ShieldAlert },
    ],
  },
  {
    label: 'Service & Abonnementer',
    icon: RefreshCw,
    items: [
      { to: '/serviceaftaler', label: 'Serviceaftaler', icon: RefreshCw },
      { to: '/serviceopgaver', label: 'Serviceopgaver', icon: Wrench },
      { to: '/abonnementer', label: 'Abonnementer', icon: Repeat },
      { to: '/afleveringsforretning', label: 'Aflevering', icon: ClipboardCheck },
      { to: '/certifikater', label: 'Certifikater', icon: Award },
    ],
  },
  {
    label: 'Dokumenter & Viden',
    icon: Archive,
    items: [
      { to: '/dokumenter', label: 'Dokumenter', icon: Archive },
      { to: '/dokument-styring', label: 'Dokumentstyring', icon: Files },
      { to: '/vidensbase', label: 'Vidensbase', icon: HelpCircle },
      { to: '/billedarkiv', label: 'Billedarkiv', icon: Images },
      { to: '/digital-signatur', label: 'Digital signatur', icon: PenLine },
    ],
  },
  {
    label: 'Firma',
    icon: Building2,
    items: [
      { to: '/ledelsesoverblik', label: 'Ledelse', icon: BarChart3 },
      { to: '/noegletal', label: 'Nøgletal', icon: PieChart },
      { to: '/aktivitetslog', label: 'Aktivitetslog', icon: History },
      { to: '/marketing', label: 'Marketing', icon: Target },
      { to: '/indstillinger', label: 'Indstillinger', icon: Settings },
      { to: '/kundeportal-indstillinger', label: 'Portal-styring', icon: Settings2 },
    ],
  },
  {
    label: 'Skærme',
    icon: Monitor,
    items: [
      { to: '/storskaerm', label: 'Storskærm', icon: Monitor },
      { to: '/infotaavle', label: 'Info-skærm', icon: Tv },
    ],
  },
];

const allItems = [
  ...primaryItems,
  ...navGroups.flatMap((g) => g.items),
];

function NavLinkRow({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'bg-amber-400 text-slate-950 shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        }`
      }
    >
      <item.icon className="w-[18px] h-[18px]" />
      {item.label}
    </NavLink>
  );
}

export default function Layout() {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});

  // Auto-expand the group that contains the active route
  const activeGroup = navGroups.find((g) =>
    g.items.some((i) => location.pathname === i.to)
  )?.label;

  const toggleGroup = (label) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const isGroupOpen = (label) => openGroups[label] || activeGroup === label;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-950 text-slate-300 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <Image src={BRAND_LOGO_URL} fittingType="fit" className="h-10 w-10 rounded-lg bg-white overflow-hidden shadow-lg shadow-amber-400/20 flex-shrink-0" alt="Juhl & Damsgaard Entreprise logo" />
          <div>
            <div className="font-bold text-white tracking-tight leading-none">Juhl & Damsgaard</div>
            <div className="text-xs text-slate-500 mt-1">Entreprise</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {primaryItems.map((item) => (
            <NavLinkRow key={item.to} item={item} />
          ))}
          {navGroups.map((group) => {
            const open = isGroupOpen(group.label);
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800/60 transition-all"
                >
                  <group.icon className="w-[18px] h-[18px] text-slate-400" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="mt-1 ml-3 pl-3 border-l border-slate-800 space-y-1">
                    {group.items.map((item) => (
                      <NavLinkRow key={item.to} item={item} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="px-3 pb-2 space-y-1">
          <a href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-slate-800/60 transition-all">
            <ExternalLink className="w-[18px] h-[18px]" />
            Forside
          </a>
          <a href="/portal" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-slate-800/60 transition-all">
            <ExternalLink className="w-[18px] h-[18px]" />
            Kundeportal
          </a>
        </div>
        <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-600">
          © 2026 Juhl & Damsgaard
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-950 text-white px-4 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-slate-950" />
        </div>
        <span className="font-bold tracking-tight">Juhl & Damsgaard</span>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden sticky top-[52px] z-20 bg-white border-b flex overflow-x-auto px-2 py-2 gap-1">
        {allItems.map((item) => (
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