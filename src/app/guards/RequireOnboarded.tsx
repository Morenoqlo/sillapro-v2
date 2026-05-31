import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { data, isLoading } = useOnboardingStatus();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!data?.hasMembership) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
