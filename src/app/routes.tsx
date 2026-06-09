import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { BarberLayout } from './layouts/BarberLayout';
import { RequireAuth } from './guards/RequireAuth';
import { RequireOnboarded } from './guards/RequireOnboarded';
import { PublicOnly } from './guards/PublicOnly';

// Auth pages (small, eager — first paint)
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { MagicLinkPage } from '@/features/auth/MagicLinkPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { LandingPage } from '@/features/landing/LandingPage';

// Public reservation flow (separate audience — lazy)
const ReservaPage = lazy(() =>
  import('@/features/reserva/ReservaPage').then((m) => ({ default: m.ReservaPage })),
);
const UnirsePage = lazy(() =>
  import('@/features/unirse/UnirsePage').then((m) => ({ default: m.UnirsePage })),
);

// Onboarding (only seen once per user — lazy)
const OnboardingPage = lazy(() =>
  import('@/features/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);

// Admin pages — split. Hoy/Agenda are the daily-driver pages so we keep
// them in the main admin chunk (loaded once on login). Reportes is heavy
// (recharts ~400KB) and rarely visited — lazy. Same for Ajustes/Equipo.
import { HoyPage } from '@/features/hoy/HoyPage';
import { AgendaPage } from '@/features/agenda/AgendaPage';
import { CajaPage } from '@/features/caja/CajaPage';
import { ClientesPage } from '@/features/clientes/ClientesPage';

const ReportesPage = lazy(() =>
  import('@/features/reportes/ReportesPage').then((m) => ({ default: m.ReportesPage })),
);
const ServiciosPage = lazy(() =>
  import('@/features/servicios/ServiciosPage').then((m) => ({ default: m.ServiciosPage })),
);
const EquipoPage = lazy(() =>
  import('@/features/equipo/EquipoPage').then((m) => ({ default: m.EquipoPage })),
);
const BarberDetailPage = lazy(() =>
  import('@/features/equipo/BarberDetailPage').then((m) => ({ default: m.BarberDetailPage })),
);
const ClientDetailPage = lazy(() =>
  import('@/features/clientes/ClientDetailPage').then((m) => ({ default: m.ClientDetailPage })),
);
const AjustesPage = lazy(() =>
  import('@/features/ajustes/AjustesPage').then((m) => ({ default: m.AjustesPage })),
);

// Barber experience — entirely separate audience, lazy
const MiDiaPage = lazy(() =>
  import('@/features/barbero/MiDiaPage').then((m) => ({ default: m.MiDiaPage })),
);
const MisComisionesPage = lazy(() =>
  import('@/features/barbero/MisComisionesPage').then((m) => ({ default: m.MisComisionesPage })),
);
const MiHistorialPage = lazy(() =>
  import('@/features/barbero/MiHistorialPage').then((m) => ({ default: m.MiHistorialPage })),
);

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-gray-500">Cargando...</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Landing pública. Si hay sesión, manda a /admin. */}
        <Route path="/" element={<PublicOnly><LandingPage /></PublicOnly>} />

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

        <Route path="/reservar/:slug" element={<ReservaPage />} />

        <Route path="/unirse" element={<UnirsePage />} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
}
