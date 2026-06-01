import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data, isLoading } = useOnboardingStatus();

  // Esperar a que user esté cargado Y la query haya resuelto al menos una vez.
  // Sin este check, data === undefined (query disabled mientras user es null
  // recién después del login) se interpretaría como "sin membership" y
  // redirige a /onboarding incorrectamente.
  if (!user || isLoading || data === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!data.hasMembership) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
