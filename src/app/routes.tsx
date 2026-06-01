import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { BarberLayout } from './layouts/BarberLayout';
import { RequireAuth } from './guards/RequireAuth';
import { RequireOnboarded } from './guards/RequireOnboarded';
import { PublicOnly } from './guards/PublicOnly';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { MagicLinkPage } from '@/features/auth/MagicLinkPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { ServiciosPage } from '@/features/servicios/ServiciosPage';
import { EquipoPage } from '@/features/equipo/EquipoPage';
import { BarberDetailPage } from '@/features/equipo/BarberDetailPage';
import { ClientesPage } from '@/features/clientes/ClientesPage';
import { ClientDetailPage } from '@/features/clientes/ClientDetailPage';
import { HoyPage } from '@/features/hoy/HoyPage';
import { AgendaPage } from '@/features/agenda/AgendaPage';
import { CajaPage } from '@/features/caja/CajaPage';

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-gray-500">Pantalla pendiente — fase posterior.</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes (públicas, redirigen a /admin si ya hay sesión) */}
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
      <Route path="/magic-link" element={<PublicOnly><MagicLinkPage /></PublicOnly>} />

      {/* Callback Y reset-password necesitan sesión recién creada por Supabase, no PublicOnly */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Onboarding: requiere auth, NO requiere onboarding (es donde se hace) */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />

      {/* Admin: requiere auth + onboarding completo */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <AdminLayout />
            </RequireOnboarded>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="hoy" replace />} />
        <Route path="hoy" element={<HoyPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="clientes/:id" element={<ClientDetailPage />} />
        <Route path="caja" element={<CajaPage />} />
        <Route path="reportes" element={<Placeholder title="Reportes" />} />
        <Route path="servicios" element={<ServiciosPage />} />
        <Route path="equipo" element={<EquipoPage />} />
        <Route path="equipo/:id" element={<BarberDetailPage />} />
        <Route path="ajustes" element={<Placeholder title="Ajustes" />} />
      </Route>

      {/* Barbero: requiere auth + onboarding */}
      <Route
        path="/barbero"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <BarberLayout />
            </RequireOnboarded>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="mi-dia" replace />} />
        <Route path="mi-dia" element={<Placeholder title="Mi día" />} />
        <Route path="comisiones" element={<Placeholder title="Comisiones" />} />
        <Route path="historial" element={<Placeholder title="Historial" />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
