import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: tenant } = useTenant();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
        aria-label="Menú de usuario"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            {tenant && <p className="text-xs text-gray-500">{tenant.barbershop.name}</p>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
