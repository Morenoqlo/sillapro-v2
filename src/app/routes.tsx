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
import { ReportesPage } from '@/features/reportes/ReportesPage';
import { MiDiaPage } from '@/features/barbero/MiDiaPage';
import { MisComisionesPage } from '@/features/barbero/MisComisionesPage';
import { MiHistorialPage } from '@/features/barbero/MiHistorialPage';
import { AjustesPage } from '@/features/ajustes/AjustesPage';

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
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="servicios" element={<ServiciosPage />} />
        <Route path="equipo" element={<EquipoPage />} />
        <Route path="equipo/:id" element={<BarberDetailPage />} />
        <Route path="ajustes" element={<AjustesPage />} />
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
        <Route path="mi-dia" element={<MiDiaPage />} />
        <Route path="comisiones" element={<MisComisionesPage />} />
        <Route path="historial" element={<MiHistorialPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
