import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Button } from '@/ui/Button';
import { UserMenu } from '@/ui/UserMenu';
import { NewAppointmentProvider, useNewAppointment } from '../NewAppointmentModalContext';

const OPERATION_LINKS = [
  { to: '/admin/hoy', label: 'Hoy' },
  { to: '/admin/agenda', label: 'Agenda' },
  { to: '/admin/clientes', label: 'Clientes' },
  { to: '/admin/caja', label: 'Caja' },
  { to: '/admin/reportes', label: 'Reportes' },
];

const CONFIG_LINKS = [
  { to: '/admin/servicios', label: 'Servicios' },
  { to: '/admin/equipo', label: 'Equipo' },
  { to: '/admin/ajustes', label: 'Ajustes' },
];

function navItemClass({ isActive }: { isActive: boolean }) {
  return cn(
    'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100',
  );
}

function AdminHeaderActions() {
  const { open } = useNewAppointment();
  return (
    <div className="flex items-center gap-2">
      <Button variant="primary" size="sm" onClick={() => open()}>
        + Cita
      </Button>
      <Button
        variant="success"
        size="sm"
        onClick={() => {
          import('sonner').then(({ toast }) => toast.info('Disponible en Plan 1D (Cobrar)'));
        }}
      >
        💳 Cobrar
      </Button>
      <div className="ml-2 border-l border-gray-200 pl-3">
        <UserMenu />
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <NewAppointmentProvider>
      <div className="flex h-full">
        <aside className="flex w-56 flex-col gap-1 border-r border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            SillaPro
          </div>
          <div className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Operación
          </div>
          {OPERATION_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navItemClass}>
              {link.label}
            </NavLink>
          ))}
          <div className="mb-1 mt-4 border-t border-gray-200 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Configuración
          </div>
          {CONFIG_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navItemClass}>
              {link.label}
            </NavLink>
          ))}
        </aside>
        <main className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
            <h1 className="text-base font-semibold">Admin</h1>
            <AdminHeaderActions />
          </header>
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </NewAppointmentProvider>
  );
}
