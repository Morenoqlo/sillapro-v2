import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function PublicOnly({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Navigate to="/admin" replace />;

  return <>{children}</>;
}
