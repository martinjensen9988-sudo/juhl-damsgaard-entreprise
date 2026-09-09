import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { routePermissionForPath } from '@/components/Layout';
import { hasModuleAccess } from '@/lib/permissions';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({
  fallback = <DefaultFallback />,
  unauthenticatedElement,
  unauthorizedElement = unauthenticatedElement,
  allowedRoles,
}) {
  const { user, isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return unauthenticatedElement;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return unauthorizedElement;
  }

  if (user?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to={`/change-password?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const routePermission = routePermissionForPath(location.pathname);
  if (routePermission && !hasModuleAccess(user, routePermission)) {
    return unauthorizedElement;
  }

  return <Outlet />;
}
