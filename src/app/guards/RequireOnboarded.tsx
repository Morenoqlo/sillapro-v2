import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useTenant } from '@/hooks/useTenant';

/**
 * Guard that:
 *  1. Waits for membership query to resolve.
 *  2. Redirects to /onboarding if no membership.
 *  3. Once tenant is loaded, redirects barbers (role === 'barber') from /admin/* to /barbero/mi-dia.
 *  4. Once tenant is loaded, redirects admins/owners from /barbero/* to /admin/hoy.
 *
 * The role redirect is a soft redirect — it does NOT block rendering while
 * the tenant query is in-flight. The user sees "Cargando..." only during the
 * initial membership check; the role redirect fires on the next render once
 * tenant data arrives. This avoids adding latency to all admin page loads.
 */
export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: status, isLoading: loadingStatus } = useOnboardingStatus();
  const { data: tenant } = useTenant(); // no isLoading — non-blocking
  const location = useLocation();

  // Phase 1: block until we know if the user has a membership
  if (!user || loadingStatus || status === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!status.hasMembership) {
    return <Navigate to="/onboarding" replace />;
  }

  // Phase 2: once tenant is available, apply role routing (non-blocking).
  // If tenant is still loading (undefined), skip the redirect this render.
  if (tenant) {
    const isBarber = tenant.role === 'barber';
    const onAdminPath = location.pathname.startsWith('/admin');
    const onBarberPath = location.pathname.startsWith('/barbero');

    if (isBarber && onAdminPath) {
      return <Navigate to="/barbero/mi-dia" replace />;
    }

    if (!isBarber && onBarberPath) {
      return <Navigate to="/admin/hoy" replace />;
    }
  }

  return <>{children}</>;
}
