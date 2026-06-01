import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useTenant } from '@/hooks/useTenant';

const TABS = [
  { to: '/barbero/mi-dia', label: 'Mi día' },
  { to: '/barbero/comisiones', label: 'Comisiones' },
  { to: '/barbero/historial', label: 'Historial' },
];

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex-1 border-t-2 py-3 text-center text-xs font-medium transition-colors',
    isActive ? 'border-brand text-brand' : 'border-transparent text-gray-500',
  );
}

export function BarberLayout() {
  const { data: tenant } = useTenant();
  const shopName = tenant?.barbershop.name ?? 'SillaPro';

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <header className="border-b border-gray-200 bg-white px-4 py-3 text-center">
        <p className="text-xs uppercase tracking-wide text-gray-500">Barbero</p>
        <p className="text-sm font-semibold text-gray-900">{shopName}</p>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
      <nav className="flex border-t border-gray-200 bg-white">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={tabClass}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
