import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import PortalLayout from '@/components/PortalLayout';
import MedarbejderAppLayout from '@/components/MedarbejderAppLayout';

// Auth pages
const Login = lazy(() => import('@/pages/Login'));
const KundeLogin = lazy(() => import('@/pages/KundeLogin'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const ChangePassword = lazy(() => import('@/pages/ChangePassword'));

// Core pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customers = lazy(() => import('@/pages/Customers'));
const Projects = lazy(() => import('@/pages/Projects'));
const Quotes = lazy(() => import('@/pages/Quotes'));
const Invoices = lazy(() => import('@/pages/Invoices'));
const Materialeliste = lazy(() => import('@/pages/Materialeliste'));
const Tidsregistrering = lazy(() => import('@/pages/Tidsregistrering'));
const Leverandoerer = lazy(() => import('@/pages/Leverandoerer'));
const Projektstatus = lazy(() => import('@/pages/Projektstatus'));
const Indstillinger = lazy(() => import('@/pages/Indstillinger'));
const CustomerPortal = lazy(() => import('@/pages/CustomerPortal'));
const ProjektGalleri = lazy(() => import('@/pages/ProjektGalleri'));
const Prisberegner = lazy(() => import('@/pages/Prisberegner'));
const Medarbejdere = lazy(() => import('@/pages/Medarbejdere'));
const Dokumenter = lazy(() => import('@/pages/Dokumenter'));
const Salgsoverblik = lazy(() => import('@/pages/Salgsoverblik'));
const Planlaegning = lazy(() => import('@/pages/Planlaegning'));
const Ledelsesoverblik = lazy(() => import('@/pages/Ledelsesoverblik'));
const Serviceaftaler = lazy(() => import('@/pages/Serviceaftaler'));
const Arbejdsedler = lazy(() => import('@/pages/Arbejdsedler'));
const Kvalitetssikring = lazy(() => import('@/pages/Kvalitetssikring'));
const Regnskab = lazy(() => import('@/pages/Regnskab'));
const TilbudVisning = lazy(() => import('@/pages/TilbudVisning'));
const Daekningsbidrag = lazy(() => import('@/pages/Daekningsbidrag'));
const RegnskabIntegration = lazy(() => import('@/pages/RegnskabIntegration'));
const AITilbud = lazy(() => import('@/pages/AITilbud'));
const Ugeplanlaegning = lazy(() => import('@/pages/Ugeplanlaegning'));
const Materielstyring = lazy(() => import('@/pages/Materielstyring'));
const SalgsPipeline = lazy(() => import('@/pages/SalgsPipeline'));
const ProjektMilepaele = lazy(() => import('@/pages/ProjektMilepaele'));
const KundeSupport = lazy(() => import('@/pages/KundeSupport'));
const Materialeindkoeb = lazy(() => import('@/pages/Materialeindkoeb'));
const ProjektOverblik = lazy(() => import('@/pages/ProjektOverblik'));
const Certifikater = lazy(() => import('@/pages/Certifikater'));
const Virksomhedsindstillinger = lazy(() => import('@/pages/Virksomhedsindstillinger'));
const Dokumentarkiv = lazy(() => import('@/pages/Dokumentarkiv'));
const Servicekatalog = lazy(() => import('@/pages/Servicekatalog'));
const Opgaveliste = lazy(() => import('@/pages/Opgaveliste'));
const Kundeoversigt = lazy(() => import('@/pages/Kundeoversigt'));
const Kundestatistik = lazy(() => import('@/pages/Kundestatistik'));
const UdloebsOversigt = lazy(() => import('@/pages/UdloebsOversigt'));
const MaterielBooking = lazy(() => import('@/pages/MaterielBooking'));
const Sikkerhedslog = lazy(() => import('@/pages/Sikkerhedslog'));
const Abonnementer = lazy(() => import('@/pages/Abonnementer'));
const Indkoebsordrer = lazy(() => import('@/pages/Indkoebsordrer'));
const Aktivitetslog = lazy(() => import('@/pages/Aktivitetslog'));
const Afvigelser = lazy(() => import('@/pages/Afvigelser'));
const KundeportalIndstillinger = lazy(() => import('@/pages/KundeportalIndstillinger'));
const Ressourceallokering = lazy(() => import('@/pages/Ressourceallokering'));
const Noegletal = lazy(() => import('@/pages/Noegletal'));
const Medarbejderoversigt = lazy(() => import('@/pages/Medarbejderoversigt'));
const Kvalitetsstyring = lazy(() => import('@/pages/Kvalitetsstyring'));
const Vaerkstedsoverblik = lazy(() => import('@/pages/Vaerkstedsoverblik'));
const Storskaerm = lazy(() => import('@/pages/Storskaerm'));
const InfoTaavle = lazy(() => import('@/pages/InfoTaavle'));
const Bilpark = lazy(() => import('@/pages/Bilpark'));
const Underentreprenoerer = lazy(() => import('@/pages/Underentreprenoerer'));
const Vidensbase = lazy(() => import('@/pages/Vidensbase'));

// Public / marketing pages
const Forside = lazy(() => import('@/pages/Forside'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Tjenester = lazy(() => import('@/pages/Tjenester'));
const TjenesteDetalje = lazy(() => import('@/pages/TjenesteDetalje'));
const BeregnTilbud = lazy(() => import('@/pages/BeregnTilbud'));
const OmOs = lazy(() => import('@/pages/OmOs'));
const Kontakt = lazy(() => import('@/pages/Kontakt'));
const KundeForside = lazy(() => import('@/pages/KundeForside'));
const KundeDashboard = lazy(() => import('@/pages/KundeDashboard'));
const ProjektArkiv = lazy(() => import('@/pages/ProjektArkiv'));
const Indkoebsliste = lazy(() => import('@/pages/Indkoebsliste'));
const Tilbudsskabeloner = lazy(() => import('@/pages/Tilbudsskabeloner'));
const LagerStyring = lazy(() => import('@/pages/LagerStyring'));
const MiljoeAffald = lazy(() => import('@/pages/MiljoeAffald'));
const FerieAdministration = lazy(() => import('@/pages/FerieAdministration'));
const OpgavePrioritering = lazy(() => import('@/pages/OpgavePrioritering'));
const ProjektOekonomi = lazy(() => import('@/pages/ProjektOekonomi'));
const Kontaktliste = lazy(() => import('@/pages/Kontaktliste'));
const CertifikatArkiv = lazy(() => import('@/pages/CertifikatArkiv'));
const Brugerprofil = lazy(() => import('@/pages/Brugerprofil'));
const Afvigelsesrapport = lazy(() => import('@/pages/Afvigelsesrapport'));
const TimeseddelRapport = lazy(() => import('@/pages/TimeseddelRapport'));
const Leverandoerfakturaer = lazy(() => import('@/pages/Leverandoerfakturaer'));
const AsbestFjernelse = lazy(() => import('@/pages/AsbestFjernelse'));
const VidensbaseFiler = lazy(() => import('@/pages/VidensbaseFiler'));
const Kundereferencer = lazy(() => import('@/pages/Kundereferencer'));
const Sikkerhedsprotokoller = lazy(() => import('@/pages/Sikkerhedsprotokoller'));
const MaterielVedligehold = lazy(() => import('@/pages/MaterielVedligehold'));
const MoedeBooking = lazy(() => import('@/pages/MoedeBooking'));
const UdgiftsOversigt = lazy(() => import('@/pages/UdgiftsOversigt'));
const MedarbejderDashboard = lazy(() => import('@/pages/MedarbejderDashboard'));
const CertifikatLog = lazy(() => import('@/pages/CertifikatLog'));
const Kundehenvendelser = lazy(() => import('@/pages/Kundehenvendelser'));
const Billedarkiv = lazy(() => import('@/pages/Billedarkiv'));
const TilbudsBeregner = lazy(() => import('@/pages/TilbudsBeregner'));
const Udstyrskalender = lazy(() => import('@/pages/Udstyrskalender'));
const Sikkerhedsinstruktioner = lazy(() => import('@/pages/Sikkerhedsinstruktioner'));
const Salgsstatistik = lazy(() => import('@/pages/Salgsstatistik'));
const AdresseOpslag = lazy(() => import('@/pages/AdresseOpslag'));
const Udgiftsstyring = lazy(() => import('@/pages/Udgiftsstyring'));
const LagerOverblik = lazy(() => import('@/pages/LagerOverblik'));
const Lagerbeholdning = lazy(() => import('@/pages/Lagerbeholdning'));
const Projektkalender = lazy(() => import('@/pages/Projektkalender'));
const Medarbejderliste = lazy(() => import('@/pages/Medarbejderliste'));
const Kvalitetskontrol = lazy(() => import('@/pages/Kvalitetskontrol'));
const Vagtplan = lazy(() => import('@/pages/Vagtplan'));
const Afleveringsforretning = lazy(() => import('@/pages/Afleveringsforretning'));
const BilparkOversigt = lazy(() => import('@/pages/BilparkOversigt'));
const MarketingKampagner = lazy(() => import('@/pages/MarketingKampagner'));
const Marketing = lazy(() => import('@/pages/Marketing'));
const Subunderleverandoerer = lazy(() => import('@/pages/Subunderleverandoerer'));
const Driftsbudget = lazy(() => import('@/pages/Driftsbudget'));
const Kundetilfredshed = lazy(() => import('@/pages/Kundetilfredshed'));
const Serviceopgaver = lazy(() => import('@/pages/Serviceopgaver'));
const Forsikringssager = lazy(() => import('@/pages/Forsikringssager'));
const TimeprisBeregner = lazy(() => import('@/pages/TimeprisBeregner'));
const Vedligeholdelseslog = lazy(() => import('@/pages/Vedligeholdelseslog'));
const Leverandoeroversigt = lazy(() => import('@/pages/Leverandoeroversigt'));
const DigitalSignatur = lazy(() => import('@/pages/DigitalSignatur'));
const TidsRapporter = lazy(() => import('@/pages/TidsRapporter'));
const AffaldsLog = lazy(() => import('@/pages/AffaldsLog'));
const Kundeportal = lazy(() => import('@/pages/Kundeportal'));
const Tilbudsanalyse = lazy(() => import('@/pages/Tilbudsanalyse'));
const Tilfredshedskema = lazy(() => import('@/pages/Tilfredshedskema'));
const Materieludlejning = lazy(() => import('@/pages/Materieludlejning'));
const Sikkerhedsarkiv = lazy(() => import('@/pages/Sikkerhedsarkiv'));
const Dokumentcenter = lazy(() => import('@/pages/Dokumentcenter'));
const Underentreprenorer = lazy(() => import('@/pages/Underentreprenorer'));
const Afvigelsesrapporter = lazy(() => import('@/pages/Afvigelsesrapporter'));
const Projektnotater = lazy(() => import('@/pages/Projektnotater'));
const Moedeoversigt = lazy(() => import('@/pages/Moedeoversigt'));
const Opgavestyring = lazy(() => import('@/pages/Opgavestyring'));
const Kursusstyring = lazy(() => import('@/pages/Kursusstyring'));
const Udstyrsudlejning = lazy(() => import('@/pages/Udstyrsudlejning'));
const Sagsarkiv = lazy(() => import('@/pages/Sagsarkiv'));
const Indkoebskurv = lazy(() => import('@/pages/Indkoebskurv'));
const SkadesrapportDetalje = lazy(() => import('@/pages/SkadesrapportDetalje'));
const Materieloversigt = lazy(() => import('@/pages/Materieloversigt'));
const Udgiftsgodkendelse = lazy(() => import('@/pages/Udgiftsgodkendelse'));
const ProjektLogbog = lazy(() => import('@/pages/ProjektLogbog'));
const RessourcePlanlaegning = lazy(() => import('@/pages/RessourcePlanlaegning'));
const Fakturaarkiv = lazy(() => import('@/pages/Fakturaarkiv'));
const Brugeradministration = lazy(() => import('@/pages/Brugeradministration'));
const OekonomiskRapport = lazy(() => import('@/pages/OekonomiskRapport'));
const Samarbejdspartnere = lazy(() => import('@/pages/Samarbejdspartnere'));
const Sikkerhedscheckliste = lazy(() => import('@/pages/Sikkerhedscheckliste'));
const KvalitetsstyringOversigt = lazy(() => import('@/pages/KvalitetsstyringOversigt'));
const Kundearkiv = lazy(() => import('@/pages/Kundearkiv'));
const Udstyrshistorik = lazy(() => import('@/pages/Udstyrshistorik'));
const MoedeKalender = lazy(() => import('@/pages/MoedeKalender'));
const Forespoergsel = lazy(() => import('@/pages/Forespoergsel'));
const Tidskalender = lazy(() => import('@/pages/Tidskalender'));
const Materialelager = lazy(() => import('@/pages/Materialelager'));
const MaterielLokation = lazy(() => import('@/pages/MaterielLokation'));
const Medarbejderarkiv = lazy(() => import('@/pages/Medarbejderarkiv'));
const VejrPlanlaegning = lazy(() => import('@/pages/VejrPlanlaegning'));
const DokumentStyring = lazy(() => import('@/pages/DokumentStyring'));
const VaerktoejService = lazy(() => import('@/pages/VaerktoejService'));
const UnderleverandoerPortal = lazy(() => import('@/pages/UnderleverandoerPortal'));
const MedarbejderCV = lazy(() => import('@/pages/MedarbejderCV'));
const ProjektTidslinje = lazy(() => import('@/pages/ProjektTidslinje'));
const MaterielLogistik = lazy(() => import('@/pages/MaterielLogistik'));
const Udlaegsstyring = lazy(() => import('@/pages/Udlaegsstyring'));
const DriftsLogbog = lazy(() => import('@/pages/DriftsLogbog'));
const MangelListe = lazy(() => import('@/pages/MangelListe'));
const PersonaleOversigt = lazy(() => import('@/pages/PersonaleOversigt'));
const Medarbejderbeskeder = lazy(() => import('@/pages/Medarbejderbeskeder'));

// Medarbejder app pages
const MaHome = lazy(() => import('@/pages/medarbejderapp/MaHome'));
const MaTid = lazy(() => import('@/pages/medarbejderapp/MaTid'));
const MaOpgaver = lazy(() => import('@/pages/medarbejderapp/MaOpgaver'));
const MaBeskeder = lazy(() => import('@/pages/medarbejderapp/MaBeskeder'));
const MaBilag = lazy(() => import('@/pages/medarbejderapp/MaBilag'));
const MaProfil = lazy(() => import('@/pages/medarbejderapp/MaProfil'));

// Extended modules
const OekonomiskOversigt = lazy(() => import('@/pages/OekonomiskOversigt'));
const UnderleverandoerListe = lazy(() => import('@/pages/UnderleverandoerListe'));
const Servicehistorik = lazy(() => import('@/pages/Servicehistorik'));
const Kvalitetsrapport = lazy(() => import('@/pages/Kvalitetsrapport'));
const ProjektBudget = lazy(() => import('@/pages/ProjektBudget'));
const Udstyrsbooking = lazy(() => import('@/pages/Udstyrsbooking'));
const Sikkerhedslogbog = lazy(() => import('@/pages/Sikkerhedslogbog'));
const LeverandoerKatalog = lazy(() => import('@/pages/LeverandoerKatalog'));
const Afvigelsesregistrering = lazy(() => import('@/pages/Afvigelsesregistrering'));
const CertifikatOvervaagning = lazy(() => import('@/pages/CertifikatOvervaagning'));
const Bemandingsplan = lazy(() => import('@/pages/Bemandingsplan'));
const FirmaProfil = lazy(() => import('@/pages/FirmaProfil'));
const Afvigelsesstyring = lazy(() => import('@/pages/Afvigelsesstyring'));
const Kursusoversigt = lazy(() => import('@/pages/Kursusoversigt'));
const KundekontaktLog = lazy(() => import('@/pages/KundekontaktLog'));
const CertifikatKontrol = lazy(() => import('@/pages/CertifikatKontrol'));
const TimebankOversigt = lazy(() => import('@/pages/TimebankOversigt'));
const IndkoebsStyring = lazy(() => import('@/pages/IndkoebsStyring'));
const UdstyrBooking = lazy(() => import('@/pages/UdstyrBooking'));
const SikkerhedApv = lazy(() => import('@/pages/SikkerhedApv'));
const AffaldsStyring = lazy(() => import('@/pages/AffaldsStyring'));
const IndkoebsGodkendelse = lazy(() => import('@/pages/IndkoebsGodkendelse'));
const KompetenceMatrix = lazy(() => import('@/pages/KompetenceMatrix'));
const RegnskabDashboard = lazy(() => import('@/pages/RegnskabDashboard'));
const Kontoplan = lazy(() => import('@/pages/Kontoplan'));
const Bogfoering = lazy(() => import('@/pages/Bogfoering'));
const Momsangivelse = lazy(() => import('@/pages/Momsangivelse'));
const Regnskabsrapporter = lazy(() => import('@/pages/Regnskabsrapporter'));
const AarsoversigtPnL = lazy(() => import('@/pages/AarsoversigtPnL'));
const ProjektOversigt = lazy(() => import('@/pages/ProjektOversigt'));
const UnderleverandoerOversigt = lazy(() => import('@/pages/UnderleverandoerOversigt'));
const Driftsoekonomi = lazy(() => import('@/pages/Driftsoekonomi'));
const ProjektTidsplan = lazy(() => import('@/pages/ProjektTidsplan'));
const ArkivOversigt = lazy(() => import('@/pages/ArkivOversigt'));
const VaerktoejLogbog = lazy(() => import('@/pages/VaerktoejLogbog'));
const FakturaScan = lazy(() => import('@/pages/FakturaScan'));
const TekniskIsoleringBeregner = lazy(() => import('@/pages/TekniskIsoleringBeregner'));
const Indkoebsordre = lazy(() => import('@/pages/Indkoebsordre'));
const LoenseddelOversigt = lazy(() => import('@/pages/LoenseddelOversigt'));
const VaerktoejListe = lazy(() => import('@/pages/VaerktoejListe'));
const LeverandoerStyring = lazy(() => import('@/pages/LeverandoerStyring'));
const LagerStatus = lazy(() => import('@/pages/LagerStatus'));
const Driftsrapport = lazy(() => import('@/pages/Driftsrapport'));
const OekonomiskStatus = lazy(() => import('@/pages/OekonomiskStatus'));
const RessourceKalender = lazy(() => import('@/pages/RessourceKalender'));
const MomsSkat = lazy(() => import('@/pages/MomsSkat'));

const PageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<Forside />} />
        <Route path="/tjenester" element={<Tjenester />} />
        <Route path="/tjenester/:slug" element={<TjenesteDetalje />} />
        <Route path="/kloak-draen" element={<TjenesteDetalje slug="kloak-draen" />} />
        <Route path="/beton-stobning" element={<TjenesteDetalje slug="beton-stobning" />} />
        <Route path="/asfalt-brolaegning" element={<TjenesteDetalje slug="asfalt-brolaegning" />} />
        <Route path="/toemrerarbejde" element={<TjenesteDetalje slug="toemrerarbejde" />} />
        <Route path="/vvs-installationer" element={<TjenesteDetalje slug="vvs-installationer" />} />
        <Route path="/elektriker" element={<TjenesteDetalje slug="elektriker" />} />
        <Route path="/skadeservice" element={<TjenesteDetalje slug="skadeservice" />} />
        <Route path="/totalentreprise" element={<TjenesteDetalje slug="totalentreprise" />} />
        <Route path="/beregn-tilbud" element={<BeregnTilbud />} />
        <Route path="/forespoergsel" element={<Forespoergsel />} />
        <Route path="/om-os" element={<OmOs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/kontakt" element={<Kontakt />} />
        <Route path="/login" element={<Login />} />
        <Route path="/kunde-login" element={<KundeLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route
          element={(
            <ProtectedRoute
              unauthenticatedElement={<Navigate to="/login" replace />}
              unauthorizedElement={<Navigate to="/portal" replace />}
              allowedRoles={['admin', 'user']}
            />
          )}
        >
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin-portal" element={<Dashboard />} />
            <Route path="/kunder" element={<Customers />} />
            <Route path="/projekter" element={<Projects />} />
            <Route path="/tilbud" element={<Quotes />} />
            <Route path="/faktura" element={<Invoices />} />
            <Route path="/Invoices" element={<Invoices />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/materialeliste" element={<Materialeliste />} />
            <Route path="/tidsregistrering" element={<Tidsregistrering />} />
            <Route path="/leverandoerer" element={<Leverandoerer />} />
            <Route path="/projektstatus" element={<Projektstatus />} />
            <Route path="/indstillinger" element={<Indstillinger />} />
            <Route path="/projekt-galleri" element={<ProjektGalleri />} />
            <Route path="/medarbejdere" element={<Medarbejdere />} />
            <Route path="/dokumenter" element={<Dokumenter />} />
            <Route path="/salgsoverblik" element={<Salgsoverblik />} />
            <Route path="/planlaegning" element={<Planlaegning />} />
            <Route path="/ledelsesoverblik" element={<Ledelsesoverblik />} />
            <Route path="/serviceaftaler" element={<Serviceaftaler />} />
            <Route path="/arbejdssedler" element={<Arbejdsedler />} />
            <Route path="/kvalitetssikring" element={<Kvalitetssikring />} />
            <Route path="/regnskab" element={<Regnskab />} />
            <Route path="/daekningsbidrag" element={<Daekningsbidrag />} />
            <Route path="/regnskab-integration" element={<RegnskabIntegration />} />
            <Route path="/ai-tilbud" element={<AITilbud />} />
            <Route path="/ugeplanlaegning" element={<Ugeplanlaegning />} />
            <Route path="/materiel" element={<Materielstyring />} />
            <Route path="/udstyr" element={<Materielstyring />} />
            <Route path="/maskinpark" element={<Materielstyring />} />
            <Route path="/salgs-pipeline" element={<SalgsPipeline />} />
            <Route path="/projekt-milepaele" element={<ProjektMilepaele />} />
            <Route path="/kundesupport" element={<KundeSupport />} />
            <Route path="/materialeindkoeb" element={<Materialeindkoeb />} />
            <Route path="/projektoverblik" element={<ProjektOverblik />} />
            <Route path="/certifikater" element={<Certifikater />} />
            <Route path="/virksomhedsindstillinger" element={<Virksomhedsindstillinger />} />
            <Route path="/dokumentarkiv" element={<Dokumentarkiv />} />
            <Route path="/servicekatalog" element={<Servicekatalog />} />
            <Route path="/opgaveliste" element={<Opgaveliste />} />
            <Route path="/kundeoversigt" element={<Kundeoversigt />} />
            <Route path="/kundestatistik" element={<Kundestatistik />} />
            <Route path="/udloebs-oversigt" element={<UdloebsOversigt />} />
            <Route path="/materiel-booking" element={<MaterielBooking />} />
            <Route path="/sikkerhedslog" element={<Sikkerhedslog />} />
            <Route path="/abonnementer" element={<Abonnementer />} />
            <Route path="/indkoebsordrer" element={<Indkoebsordrer />} />
            <Route path="/aktivitetslog" element={<Aktivitetslog />} />
            <Route path="/afvigelser" element={<Afvigelser />} />
            <Route path="/kundeportal-indstillinger" element={<KundeportalIndstillinger />} />
            <Route path="/ressourceallokering" element={<Ressourceallokering />} />
            <Route path="/noegletal" element={<Noegletal />} />
            <Route path="/medarbejder-administration" element={<Medarbejderoversigt />} />
            <Route path="/kvalitetsstyring" element={<Kvalitetsstyring />} />
            <Route path="/vaerksted" element={<Vaerkstedsoverblik />} />
            <Route path="/bilpark" element={<Bilpark />} />
            <Route path="/underentreprenoerer" element={<Underentreprenoerer />} />
            <Route path="/vidensbase" element={<Vidensbase />} />
            <Route path="/portal/knowledgebase" element={<Vidensbase />} />
            <Route path="/admin/knowledgebase" element={<Vidensbase />} />
            <Route path="/projekt-arkiv" element={<ProjektArkiv />} />
            <Route path="/indkoebsliste" element={<Indkoebsliste />} />
            <Route path="/tilbudsskabeloner" element={<Tilbudsskabeloner />} />
            <Route path="/lager-styring" element={<LagerStyring />} />
            <Route path="/miljoe-affald" element={<MiljoeAffald />} />
            <Route path="/ferie-administration" element={<FerieAdministration />} />
            <Route path="/opgave-prioritering" element={<OpgavePrioritering />} />
            <Route path="/projekt-oekonomi" element={<ProjektOekonomi />} />
            <Route path="/kontaktliste" element={<Kontaktliste />} />
            <Route path="/certifikat-arkiv" element={<CertifikatArkiv />} />
            <Route path="/brugerprofil" element={<Brugerprofil />} />
            <Route path="/afvigelsesrapport" element={<Afvigelsesrapport />} />
            <Route path="/timeseddel-rapport" element={<TimeseddelRapport />} />
            <Route path="/leverandoerfakturaer" element={<Leverandoerfakturaer />} />
            <Route path="/asbestfjernelse" element={<AsbestFjernelse />} />
            <Route path="/asbest-dokumentation" element={<AsbestFjernelse />} />
            <Route path="/vidensbase-filer" element={<VidensbaseFiler />} />
            <Route path="/kundereferencer" element={<Kundereferencer />} />
            <Route path="/sikkerhedsprotokoller" element={<Sikkerhedsprotokoller />} />
            <Route path="/materiel-vedligehold" element={<MaterielVedligehold />} />
            <Route path="/moede-booking" element={<MoedeBooking />} />
            <Route path="/udgifts-oversigt" element={<UdgiftsOversigt />} />
            <Route path="/medarbejder-dashboard" element={<MedarbejderDashboard />} />
            <Route path="/certifikat-log" element={<CertifikatLog />} />
            <Route path="/kundehenvendelser" element={<Kundehenvendelser />} />
            <Route path="/billedarkiv" element={<Billedarkiv />} />
            <Route path="/tilbuds-beregner" element={<TilbudsBeregner />} />
            <Route path="/udstyrskalender" element={<Udstyrskalender />} />
            <Route path="/sikkerhedsinstruktioner" element={<Sikkerhedsinstruktioner />} />
            <Route path="/salgsstatistik" element={<Salgsstatistik />} />
            <Route path="/adresse-opslag" element={<AdresseOpslag />} />
            <Route path="/udgiftsstyring" element={<Udgiftsstyring />} />
            <Route path="/lager-overblik" element={<LagerOverblik />} />
            <Route path="/lagerbeholdning" element={<Lagerbeholdning />} />
            <Route path="/projektkalender" element={<Projektkalender />} />
            <Route path="/medarbejderliste" element={<Medarbejderliste />} />
            <Route path="/kvalitetskontrol" element={<Kvalitetskontrol />} />
            <Route path="/vagtplan" element={<Vagtplan />} />
            <Route path="/afleveringsforretning" element={<Afleveringsforretning />} />
            <Route path="/bilpark-oversigt" element={<BilparkOversigt />} />
            <Route path="/marketing-kampagner" element={<MarketingKampagner />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/subunderleverandoerer" element={<Subunderleverandoerer />} />
            <Route path="/driftsbudget" element={<Driftsbudget />} />
            <Route path="/kundetilfredshed" element={<Kundetilfredshed />} />
            <Route path="/serviceopgaver" element={<Serviceopgaver />} />
            <Route path="/forsikringssager" element={<Forsikringssager />} />
            <Route path="/timepris-beregner" element={<TimeprisBeregner />} />
            <Route path="/vedligeholdelseslog" element={<Vedligeholdelseslog />} />
            <Route path="/leverandoeroversigt" element={<Leverandoeroversigt />} />
            <Route path="/digital-signatur" element={<DigitalSignatur />} />
            <Route path="/tids-rapporter" element={<TidsRapporter />} />
            <Route path="/affalds-log" element={<AffaldsLog />} />
            <Route path="/tilbudsanalyse" element={<Tilbudsanalyse />} />
            <Route path="/materieludlejning" element={<Materieludlejning />} />
            <Route path="/firma-indstillinger" element={<Virksomhedsindstillinger />} />
            <Route path="/sikkerhedsarkiv" element={<Sikkerhedsarkiv />} />
            <Route path="/dokumentcenter" element={<Dokumentcenter />} />
            <Route path="/underentreprenorer" element={<Underentreprenorer />} />
            <Route path="/afvigelsesrapporter" element={<Afvigelsesrapporter />} />
            <Route path="/projektnotater" element={<Projektnotater />} />
            <Route path="/moedeoversigt" element={<Moedeoversigt />} />
            <Route path="/opgavestyring" element={<Opgavestyring />} />
            <Route path="/kursusstyring" element={<Kursusstyring />} />
            <Route path="/udstyrsudlejning" element={<Udstyrsudlejning />} />
            <Route path="/sagsarkiv" element={<Sagsarkiv />} />
            <Route path="/indkoebskurv" element={<Indkoebskurv />} />
            <Route path="/skadesrapport" element={<SkadesrapportDetalje />} />
            <Route path="/materiel-oversigt" element={<Materieloversigt />} />
            <Route path="/udgifts-godkendelse" element={<Udgiftsgodkendelse />} />
            <Route path="/projekt-logbog" element={<ProjektLogbog />} />
            <Route path="/ressource-planlaegning" element={<RessourcePlanlaegning />} />
            <Route path="/faktura-arkiv" element={<Fakturaarkiv />} />
            <Route path="/bruger-administration" element={<Brugeradministration />} />
            <Route path="/oekonomi-rapport" element={<OekonomiskRapport />} />
            <Route path="/samarbejdspartnere" element={<Samarbejdspartnere />} />
            <Route path="/sikkerheds-tjekliste" element={<Sikkerhedscheckliste />} />
            <Route path="/kvalitetsstyring-oversigt" element={<KvalitetsstyringOversigt />} />
            <Route path="/kundearkiv" element={<Kundearkiv />} />
            <Route path="/udstyrs-historik" element={<Udstyrshistorik />} />
            <Route path="/moede-kalender" element={<MoedeKalender />} />
            <Route path="/tidskalender" element={<Tidskalender />} />
            <Route path="/materiale-lager" element={<Materialelager />} />
            <Route path="/materiel-lokationer" element={<MaterielLokation />} />
            <Route path="/medarbejder-arkiv" element={<Medarbejderarkiv />} />
            <Route path="/vejr-planlaegning" element={<VejrPlanlaegning />} />
            <Route path="/dokument-styring" element={<DokumentStyring />} />
            <Route path="/vaerktoej-service" element={<VaerktoejService />} />
            <Route path="/underleverandoer-portal" element={<UnderleverandoerPortal />} />
            <Route path="/medarbejder-cv" element={<MedarbejderCV />} />
            <Route path="/projekt-tidslinje" element={<ProjektTidslinje />} />
            <Route path="/materiel-logistik" element={<MaterielLogistik />} />
            <Route path="/udlaegsstyring" element={<Udlaegsstyring />} />
            <Route path="/drifts-logbog" element={<DriftsLogbog />} />
            <Route path="/mangel-liste" element={<MangelListe />} />
            <Route path="/personale-oversigt" element={<PersonaleOversigt />} />
            <Route path="/medarbejder-beskeder" element={<Medarbejderbeskeder />} />
            <Route path="/oekonomisk-oversigt" element={<OekonomiskOversigt />} />
            <Route path="/underleverandoerer" element={<UnderleverandoerListe />} />
            <Route path="/servicehistorik" element={<Servicehistorik />} />
            <Route path="/kvalitetsrapport" element={<Kvalitetsrapport />} />
            <Route path="/projekt-budget" element={<ProjektBudget />} />
            <Route path="/udstyrs-booking" element={<Udstyrsbooking />} />
            <Route path="/sikkerheds-logbog" element={<Sikkerhedslogbog />} />
            <Route path="/leverandoer-katalog" element={<LeverandoerKatalog />} />
            <Route path="/afvigelses-registrering" element={<Afvigelsesregistrering />} />
            <Route path="/certifikat-overvaagning" element={<CertifikatOvervaagning />} />
            <Route path="/bemandings-plan" element={<Bemandingsplan />} />
            <Route path="/firma-profil" element={<FirmaProfil />} />
            <Route path="/afvigelsesstyring" element={<Afvigelsesstyring />} />
            <Route path="/kursus-oversigt" element={<Kursusoversigt />} />
            <Route path="/kundekontakt-log" element={<KundekontaktLog />} />
            <Route path="/certifikat-kontrol" element={<CertifikatKontrol />} />
            <Route path="/timebank-oversigt" element={<TimebankOversigt />} />
            <Route path="/indkoebs-styring" element={<IndkoebsStyring />} />
            <Route path="/udstyr-booking" element={<UdstyrBooking />} />
            <Route path="/sikkerhed-apv" element={<SikkerhedApv />} />
            <Route path="/SikkerhedApv" element={<SikkerhedApv />} />
            <Route path="/affalds-styring" element={<AffaldsStyring />} />
            <Route path="/indkoebs-godkendelse" element={<IndkoebsGodkendelse />} />
            <Route path="/kompetence-matrix" element={<KompetenceMatrix />} />
            <Route path="/regnskab-program" element={<RegnskabDashboard />} />
            <Route path="/regnskab-kontoplan" element={<Kontoplan />} />
            <Route path="/regnskab-bogfoering" element={<Bogfoering />} />
            <Route path="/regnskab-moms" element={<Momsangivelse />} />
            <Route path="/regnskab-rapporter" element={<Regnskabsrapporter />} />
            <Route path="/regnskab-aarsoversigt" element={<AarsoversigtPnL />} />
            <Route path="/projekt-oversigt" element={<ProjektOversigt />} />
            <Route path="/underleverandoer-oversigt" element={<UnderleverandoerOversigt />} />
            <Route path="/driftsoekonomi" element={<Driftsoekonomi />} />
            <Route path="/projekt-tidsplan" element={<ProjektTidsplan />} />
            <Route path="/arkiv-oversigt" element={<ArkivOversigt />} />
            <Route path="/vaerktoej-logbog" element={<VaerktoejLogbog />} />
            <Route path="/faktura-scan" element={<FakturaScan />} />
            <Route path="/teknisk-isolering-beregner" element={<TekniskIsoleringBeregner />} />
            <Route path="/indkoebsordre" element={<Indkoebsordre />} />
            <Route path="/loenseddel-oversigt" element={<LoenseddelOversigt />} />
            <Route path="/vaerktoej-liste" element={<VaerktoejListe />} />
            <Route path="/leverandoer-styring" element={<LeverandoerStyring />} />
            <Route path="/lager-status" element={<LagerStatus />} />
            <Route path="/drifts-rapport" element={<Driftsrapport />} />
            <Route path="/oekonomisk-status" element={<OekonomiskStatus />} />
            <Route path="/ressource-kalender" element={<RessourceKalender />} />
            <Route path="/moms-regnskab" element={<MomsSkat />} />
          </Route>
          <Route path="/storskaerm" element={<Storskaerm />} />
          <Route path="/infotaavle" element={<InfoTaavle />} />
          <Route element={<MedarbejderAppLayout />}>
            <Route path="/app" element={<MaHome />} />
            <Route path="/app/tid" element={<MaTid />} />
            <Route path="/app/opgaver" element={<MaOpgaver />} />
            <Route path="/app/beskeder" element={<MaBeskeder />} />
            <Route path="/app/bilag" element={<MaBilag />} />
            <Route path="/app/profil" element={<MaProfil />} />
          </Route>
        </Route>
        <Route
          element={(
            <ProtectedRoute
              unauthenticatedElement={<Navigate to="/kunde-login" replace />}
              unauthorizedElement={<Navigate to="/login" replace />}
              allowedRoles={['admin', 'customer']}
            />
          )}
        >
          <Route element={<PortalLayout />}>
            <Route path="/portal" element={<CustomerPortal />} />
            <Route path="/prisberegner" element={<Prisberegner />} />
            <Route path="/kunde-forside" element={<KundeForside />} />
            <Route path="/kunde-dashboard" element={<KundeDashboard />} />
            <Route path="/portal/tilbud/:id" element={<TilbudVisning />} />
            <Route path="/portal/tilfredshed" element={<Tilfredshedskema />} />
          </Route>
          <Route path="/kundeportal" element={<Kundeportal />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
