import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AnimatedOutlet from '@/components/AnimatedOutlet';
import BackHeader from '@/components/BackHeader';
import PullToRefresh from '@/components/PullToRefresh';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Image } from '@/components/ui/image';
import { BRAND_LOGO_URL } from '@/lib/brand';
import { useAuth } from '@/lib/AuthContext';
import { hasModuleAccess, pathToPermission } from '@/lib/permissions';
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
  Sparkles,
  Wrench,
  Filter,
  Headphones,
  ShoppingCart,
  Award,
  Files,
  Warehouse,
  Recycle,
  Palmtree,
  Calculator,
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
  HelpCircle,
  ClipboardCheck,
  MessageSquare,
  ChevronDown,
  BookOpen,
  Menu as MenuIcon,
} from 'lucide-react';

const primaryItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
];

const navGroups = [
  {
    label: 'Salg & Tilbud',
    permission: 'sales',
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
    permission: 'customers',
    icon: Users,
    items: [
      { to: '/kunder', label: 'Kunder', icon: Users },
      { to: '/kundetilfredshed', label: 'Kundetilfredshed', icon: Star },
      { to: '/kundesupport', label: 'Kundesupport', icon: Headphones },
      { to: '/kundekontakt-log', label: 'Kundekontakt-log', icon: MessageSquare },
      { to: '/kundearkiv', label: 'Kundearkiv', icon: Archive },
    ],
  },
  {
    label: 'Projekter',
    permission: 'projects',
    icon: HardHat,
    items: [
      { to: '/projekter', label: 'Projekter', icon: HardHat },
      { to: '/projektstatus', label: 'Projektstatus', icon: Activity },
      { to: '/projekt-oekonomi', label: 'Projektøkonomi', icon: Calculator },
      { to: '/projektkalender', label: 'Projektkalender', icon: CalendarDays },
      { to: '/drifts-logbog', label: 'Driftslogbog', icon: ClipboardList },
    ],
  },
  {
    label: 'Økonomi',
    permission: 'finance',
    icon: FileSpreadsheet,
    items: [
      { to: '/faktura', label: 'Fakturaer', icon: Receipt },
      { to: '/regnskab', label: 'Regnskab', icon: FileSpreadsheet },
      { to: '/regnskab-bogfoering', label: 'Bogføring', icon: BookOpen },
      { to: '/regnskab-moms', label: 'Momsangivelse', icon: Receipt },
      { to: '/leverandoerfakturaer', label: 'Leverandørfakturaer', icon: FileCheck },
      { to: '/udgiftsstyring', label: 'Udgiftsstyring', icon: Receipt },
      { to: '/oekonomi-rapport', label: 'Økonomirapport', icon: BarChart3 },
    ],
  },
  {
    label: 'Planlægning',
    permission: 'planning',
    icon: CalendarDays,
    items: [
      { to: '/planlaegning', label: 'Planlægning', icon: CalendarDays },
      { to: '/ugeplanlaegning', label: 'Ugeplan', icon: CalendarDays },
      { to: '/vagtplan', label: 'Vagtplan', icon: CalendarClock },
      { to: '/moede-booking', label: 'Mødebooker', icon: CalendarPlus },
      { to: '/ressourceallokering', label: 'Ressource', icon: Users2 },
    ],
  },
  {
    label: 'Opgaver',
    permission: 'tasks',
    icon: ClipboardList,
    items: [
      { to: '/opgaveliste', label: 'Opgaveliste', icon: ClipboardList },
      { to: '/arbejdssedler', label: 'Arbejdssedler', icon: ClipboardList },
    ],
  },
  {
    label: 'Materialer & Lager',
    permission: 'materials',
    icon: Package,
    items: [
      { to: '/materialeliste', label: 'Materialer', icon: Package },
      { to: '/indkoebs-styring', label: 'Indkøb', icon: ShoppingCart },
      { to: '/indkoebs-godkendelse', label: 'Indkøbsgodkendelse', icon: ClipboardCheck },
      { to: '/lager-styring', label: 'Lagerstyring', icon: Warehouse },
    ],
  },
  {
    label: 'Materiel & Udstyr',
    permission: 'equipment',
    icon: Wrench,
    items: [
      { to: '/materiel', label: 'Materiel', icon: Wrench },
      { to: '/udstyrskalender', label: 'Udstyrskalender', icon: CalendarDays },
      { to: '/udstyr-booking', label: 'Udstyr booking', icon: CalendarDays },
      { to: '/vaerktoej-service', label: 'Værktøjsservice', icon: Wrench },
      { to: '/bilpark', label: 'Bilpark', icon: Car },
    ],
  },
  {
    label: 'Medarbejdere',
    permission: 'employees',
    icon: Contact,
    items: [
      { to: '/medarbejdere', label: 'Medarbejdere', icon: Contact },
      { to: '/tidsregistrering', label: 'Tidsregistrering', icon: Clock },
      { to: '/tidskalender', label: 'Tidskalender', icon: CalendarDays },
      { to: '/ferie-administration', label: 'Ferie', icon: Palmtree },
      { to: '/bruger-administration', label: 'Brugeradministration', icon: UserCog },
      { to: '/medarbejder-beskeder', label: 'Medarbejderbeskeder', icon: MessageSquare },
    ],
  },
  {
    label: 'Leverandører',
    permission: 'suppliers',
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
    permission: 'quality',
    icon: ShieldCheck,
    items: [
      { to: '/kvalitetssikring', label: 'Kvalitet', icon: ShieldCheck },
      { to: '/sikkerhedslog', label: 'Sikkerhedslog', icon: ShieldAlert },
      { to: '/afvigelser', label: 'Afvigelser', icon: AlertOctagon },
      { to: '/sikkerhed-apv', label: 'Sikkerhed & APV', icon: ShieldCheck },
      { to: '/sikkerheds-tjekliste', label: 'Sikkerheds-tjekliste', icon: ClipboardCheck },
      { to: '/forsikringssager', label: 'Forsikringssager', icon: ShieldAlert },
    ],
  },
  {
    label: 'Miljø & Affald',
    permission: 'environment',
    icon: Recycle,
    items: [
      { to: '/miljoe-affald', label: 'Miljø & Affald', icon: Recycle },
      { to: '/affalds-styring', label: 'Affaldshåndtering', icon: Recycle },
      { to: '/asbestfjernelse', label: 'Asbest', icon: ShieldAlert },
    ],
  },
  {
    label: 'Service & Abonnementer',
    permission: 'service',
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
    permission: 'documents',
    icon: Archive,
    items: [
      { to: '/dokumenter', label: 'Dokumenter', icon: Archive },
      { to: '/dokument-styring', label: 'Dokumentstyring', icon: Files },
      { to: '/vidensbase', label: 'Vidensbase', icon: HelpCircle },
      { to: '/billedarkiv', label: 'Billedarkiv', icon: Images },
    ],
  },
  {
    label: 'Firma',
    permission: 'company',
    icon: Building2,
    items: [
      { to: '/ledelsesoverblik', label: 'Ledelse', icon: BarChart3 },
      { to: '/aktivitetslog', label: 'Aktivitetslog', icon: History },
      { to: '/marketing', label: 'Marketing', icon: Target },
      { to: '/firma-profil', label: 'Firma profil', icon: Building2 },
      { to: '/indstillinger', label: 'Indstillinger', icon: Settings },
      { to: '/kundeportal-indstillinger', label: 'Portal-styring', icon: Settings2 },
    ],
  },
  {
    label: 'Skærme',
    permission: 'screens',
    icon: Monitor,
    items: [
      { to: '/storskaerm', label: 'Storskærm', icon: Monitor },
      { to: '/infotaavle', label: 'Info-skærm', icon: Tv },
    ],
  },
];

export const internalNavGroups = navGroups;
export const routePermissionForPath = (pathname) => pathToPermission(pathname, navGroups);

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
  const { user } = useAuth();
  const [openGroups, setOpenGroups] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleGroups = navGroups.filter((group) => hasModuleAccess(user, group.permission));
  const allItems = [
    ...primaryItems,
    ...visibleGroups.flatMap((g) => g.items),
  ];

  // Auto-expand the group that contains the active route
  const activeGroup = visibleGroups.find((g) =>
    g.items.some((i) => location.pathname === i.to)
  )?.label;

  const toggleGroup = (label) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const isGroupOpen = (label) => openGroups[label] || activeGroup === label;

  const backTitle = allItems.find((i) => i.to === location.pathname)?.label || '';
  const showBack = !['/dashboard', '/admin', '/admin-portal'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
          {visibleGroups.map((group) => {
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

      {/* Mobile header — brand + Menu button (opens grouped bottom drawer) */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-950 safe-pt safe-px">
        <div className="px-4 py-3 flex items-center justify-between text-white">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-slate-950" />
            </div>
            <span className="font-bold tracking-tight">Juhl & Damsgaard</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-amber-400 tap-target px-3 py-2 rounded-lg hover:bg-slate-800/60"
          >
            <MenuIcon className="w-5 h-5" /> Menu
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer — grouped, collapsible bottom sheet */}
      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-left">Navigation</DrawerTitle>
          </DrawerHeader>
          <div className="px-3 pb-6 overflow-y-auto max-h-[75vh] space-y-4">
            {primaryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-amber-400 text-slate-950' : 'text-slate-700 hover:bg-slate-100'}`
                }
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </NavLink>
            ))}
            {visibleGroups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 px-1">
                  <group.icon className="w-3.5 h-3.5" /> {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-amber-400 text-slate-950' : 'text-slate-700 hover:bg-slate-100'}`
                      }
                    >
                      <item.icon className="w-4 h-4" /> {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 space-y-0.5">
              <a href="/" target="_blank" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-600 hover:bg-slate-100">
                <ExternalLink className="w-4 h-4" /> Forside
              </a>
              <a href="/portal" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-600 hover:bg-slate-100">
                <ExternalLink className="w-4 h-4" /> Kundeportal
              </a>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <div className="md:ml-64">
        <main className="p-4 md:p-8 max-w-7xl mx-auto safe-pb">
          {showBack && <BackHeader title={backTitle} to="/dashboard" />}
          <PullToRefresh onRefresh={() => window.location.reload()}>
            <AnimatedOutlet />
          </PullToRefresh>
        </main>
      </div>
    </div>
  );
}
