import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import Projects from '@/pages/Projects';
import Quotes from '@/pages/Quotes';
import Invoices from '@/pages/Invoices';
import Materialeliste from '@/pages/Materialeliste';
import Tidsregistrering from '@/pages/Tidsregistrering';
import Leverandoerer from '@/pages/Leverandoerer';
import Projektstatus from '@/pages/Projektstatus';
import Indstillinger from '@/pages/Indstillinger';
import CustomerPortal from '@/pages/CustomerPortal';
import PortalLayout from '@/components/PortalLayout';
import ProjektGalleri from '@/pages/ProjektGalleri';
import Prisberegner from '@/pages/Prisberegner';
import Medarbejdere from '@/pages/Medarbejdere';
import Dokumenter from '@/pages/Dokumenter';
import Salgsoverblik from '@/pages/Salgsoverblik';
import Planlaegning from '@/pages/Planlaegning';
import Ledelsesoverblik from '@/pages/Ledelsesoverblik';
import Serviceaftaler from '@/pages/Serviceaftaler';
import Arbejdsedler from '@/pages/Arbejdsedler';
import Kvalitetssikring from '@/pages/Kvalitetssikring';
import Regnskab from '@/pages/Regnskab';
import TilbudVisning from '@/pages/TilbudVisning';
import Daekningsbidrag from '@/pages/Daekningsbidrag';
import RegnskabIntegration from '@/pages/RegnskabIntegration';
import AITilbud from '@/pages/AITilbud';
import Ugeplanlaegning from '@/pages/Ugeplanlaegning';
import Materielstyring from '@/pages/Materielstyring';
import SalgsPipeline from '@/pages/SalgsPipeline';
import ProjektMilepaele from '@/pages/ProjektMilepaele';
import KundeSupport from '@/pages/KundeSupport';
import Materialeindkoeb from '@/pages/Materialeindkoeb';
import ProjektOverblik from '@/pages/ProjektOverblik';
import Certifikater from '@/pages/Certifikater';
import Virksomhedsindstillinger from '@/pages/Virksomhedsindstillinger';
import Dokumentarkiv from '@/pages/Dokumentarkiv';
import Servicekatalog from '@/pages/Servicekatalog';
import Opgaveliste from '@/pages/Opgaveliste';
import Kundeoversigt from '@/pages/Kundeoversigt';
import Kundestatistik from '@/pages/Kundestatistik';
import UdloebsOversigt from '@/pages/UdloebsOversigt';
import MaterielBooking from '@/pages/MaterielBooking';
import Sikkerhedslog from '@/pages/Sikkerhedslog';
import Abonnementer from '@/pages/Abonnementer';
import Indkoebsordrer from '@/pages/Indkoebsordrer';
import Aktivitetslog from '@/pages/Aktivitetslog';
import Afvigelser from '@/pages/Afvigelser';
import KundeportalIndstillinger from '@/pages/KundeportalIndstillinger';
import Ressourceallokering from '@/pages/Ressourceallokering';
import Noegletal from '@/pages/Noegletal';
import Medarbejderoversigt from '@/pages/Medarbejderoversigt';
import Kvalitetsstyring from '@/pages/Kvalitetsstyring';
import Vaerkstedsoverblik from '@/pages/Vaerkstedsoverblik';
import Storskaerm from '@/pages/Storskaerm';
import InfoTaavle from '@/pages/InfoTaavle';
import Bilpark from '@/pages/Bilpark';
import Underentreprenoerer from '@/pages/Underentreprenoerer';
import Vidensbase from '@/pages/Vidensbase';
import Forside from '@/pages/Forside';
import FAQ from '@/pages/FAQ';
import Tjenester from '@/pages/Tjenester';
import TjenesteDetalje from '@/pages/TjenesteDetalje';
import BeregnTilbud from '@/pages/BeregnTilbud';
import OmOs from '@/pages/OmOs';
import Kontakt from '@/pages/Kontakt';
import KundeForside from '@/pages/KundeForside';
import KundeDashboard from '@/pages/KundeDashboard';
import ProjektArkiv from '@/pages/ProjektArkiv';
import Indkoebsliste from '@/pages/Indkoebsliste';
import Tilbudsskabeloner from '@/pages/Tilbudsskabeloner';
import LagerStyring from '@/pages/LagerStyring';
import MiljoeAffald from '@/pages/MiljoeAffald';
import FerieAdministration from '@/pages/FerieAdministration';
import OpgavePrioritering from '@/pages/OpgavePrioritering';
import ProjektOekonomi from '@/pages/ProjektOekonomi';
import Kontaktliste from '@/pages/Kontaktliste';
import CertifikatArkiv from '@/pages/CertifikatArkiv';
import Brugerprofil from '@/pages/Brugerprofil';
import Afvigelsesrapport from '@/pages/Afvigelsesrapport';
import TimeseddelRapport from '@/pages/TimeseddelRapport';
import Leverandoerfakturaer from '@/pages/Leverandoerfakturaer';
import AsbestFjernelse from '@/pages/AsbestFjernelse';
import VidensbaseFiler from '@/pages/VidensbaseFiler';
import Kundereferencer from '@/pages/Kundereferencer';
import Sikkerhedsprotokoller from '@/pages/Sikkerhedsprotokoller';
import MaterielVedligehold from '@/pages/MaterielVedligehold';
import MoedeBooking from '@/pages/MoedeBooking';
import UdgiftsOversigt from '@/pages/UdgiftsOversigt';
import MedarbejderDashboard from '@/pages/MedarbejderDashboard';
import CertifikatLog from '@/pages/CertifikatLog';
import Kundehenvendelser from '@/pages/Kundehenvendelser';
import Billedarkiv from '@/pages/Billedarkiv';
import TilbudsBeregner from '@/pages/TilbudsBeregner';
import Udstyrskalender from '@/pages/Udstyrskalender';
import Sikkerhedsinstruktioner from '@/pages/Sikkerhedsinstruktioner';
import Salgsstatistik from '@/pages/Salgsstatistik';
import AdresseOpslag from '@/pages/AdresseOpslag';
import Udgiftsstyring from '@/pages/Udgiftsstyring';
import LagerOverblik from '@/pages/LagerOverblik';
import Lagerbeholdning from '@/pages/Lagerbeholdning';
import Projektkalender from '@/pages/Projektkalender';
import Medarbejderliste from '@/pages/Medarbejderliste';
import Kvalitetskontrol from '@/pages/Kvalitetskontrol';
import Vagtplan from '@/pages/Vagtplan';
import Afleveringsforretning from '@/pages/Afleveringsforretning';
import BilparkOversigt from '@/pages/BilparkOversigt';
import MarketingKampagner from '@/pages/MarketingKampagner';
import Marketing from '@/pages/Marketing';
import Subunderleverandoerer from '@/pages/Subunderleverandoerer';
import Driftsbudget from '@/pages/Driftsbudget';
import Kundetilfredshed from '@/pages/Kundetilfredshed';
import Serviceopgaver from '@/pages/Serviceopgaver';
import Forsikringssager from '@/pages/Forsikringssager';
import TimeprisBeregner from '@/pages/TimeprisBeregner';
import Vedligeholdelseslog from '@/pages/Vedligeholdelseslog';
import Leverandoeroversigt from '@/pages/Leverandoeroversigt';
import DigitalSignatur from '@/pages/DigitalSignatur';
import TidsRapporter from '@/pages/TidsRapporter';
import AffaldsLog from '@/pages/AffaldsLog';
import Kundeportal from '@/pages/Kundeportal';
import Tilbudsanalyse from '@/pages/Tilbudsanalyse';
import Tilfredshedskema from '@/pages/Tilfredhedskema';
import Materieludlejning from '@/pages/Materieludlejning';
import Sikkerhedsarkiv from '@/pages/Sikkerhedsarkiv';
import Dokumentcenter from '@/pages/Dokumentcenter';
import Underentreprenorer from '@/pages/Underentreprenorer';
import Afvigelsesrapporter from '@/pages/Afvigelsesrapporter';
import Projektnotater from '@/pages/Projektnotater';
import Moedeoversigt from '@/pages/Moedeoversigt';
import Opgavestyring from '@/pages/Opgavestyring';
import Kursusstyring from '@/pages/Kursusstyring';
import Udstyrsudlejning from '@/pages/Udstyrsudlejning';
import Sagsarkiv from '@/pages/Sagsarkiv';
import Indkoebskurv from '@/pages/Indkoebskurv';
import SkadesrapportDetalje from '@/pages/SkadesrapportDetalje';
import Materieloversigt from '@/pages/Materieloversigt';
import Udgiftsgodkendelse from '@/pages/Udgiftsgodkendelse';
import ProjektLogbog from '@/pages/ProjektLogbog';
import RessourcePlanlaegning from '@/pages/RessourcePlanlaegning';
import Fakturaarkiv from '@/pages/Fakturaarkiv';
import Brugeradministration from '@/pages/Brugeradministration';
import OekonomiskRapport from '@/pages/OekonomiskRapport';
import Samarbejdspartnere from '@/pages/Samarbejdspartnere';
import Sikkerhedscheckliste from '@/pages/Sikkerhedscheckliste';
import KvalitetsstyringOversigt from '@/pages/KvalitetsstyringOversigt';
import Kundearkiv from '@/pages/Kundearkiv';
import Udstyrshistorik from '@/pages/Udstyrshistorik';
import MoedeKalender from '@/pages/MoedeKalender';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Forside />} />
      <Route path="/tjenester" element={<Tjenester />} />
      <Route path="/tjenester/:slug" element={<TjenesteDetalje />} />
      <Route path="/beregn-tilbud" element={<BeregnTilbud />} />
      <Route path="/om-os" element={<OmOs />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/kontakt" element={<Kontakt />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/kunder" element={<Customers />} />
          <Route path="/projekter" element={<Projects />} />
          <Route path="/tilbud" element={<Quotes />} />
          <Route path="/faktura" element={<Invoices />} />
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
        </Route>
        <Route element={<PortalLayout />}>
          <Route path="/portal" element={<CustomerPortal />} />
          <Route path="/prisberegner" element={<Prisberegner />} />
          <Route path="/kunde-forside" element={<KundeForside />} />
          <Route path="/kunde-dashboard" element={<KundeDashboard />} />
          <Route path="/portal/tilbud/:id" element={<TilbudVisning />} />
          <Route path="/portal/tilfredshed" element={<Tilfredshedskema />} />
        </Route>
        <Route path="/storskaerm" element={<Storskaerm />} />
        <Route path="/infotaavle" element={<InfoTaavle />} />
        <Route path="/kundeportal" element={<Kundeportal />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App