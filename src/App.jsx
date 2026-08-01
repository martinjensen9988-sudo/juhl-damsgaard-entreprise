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
        </Route>
        <Route element={<PortalLayout />}>
          <Route path="/portal" element={<CustomerPortal />} />
          <Route path="/prisberegner" element={<Prisberegner />} />
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