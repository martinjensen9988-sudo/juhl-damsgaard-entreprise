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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
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
        </Route>
        <Route element={<PortalLayout />}>
          <Route path="/portal" element={<CustomerPortal />} />
          <Route path="/prisberegner" element={<Prisberegner />} />
          <Route path="/portal/tilbud/:id" element={<TilbudVisning />} />
        </Route>
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