import { Link } from 'react-router-dom';

export function LandingPricing() {
  return (
    <section id="precio" className="border-t border-gray-100 bg-gray-50 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold text-brand">Un solo plan, todo incluido</h2>
        <p className="mt-3 text-gray-600">Sin sorpresas. Sin diferencias entre planes.</p>

        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-brand">$9.990</span>
            <span className="text-gray-500">/mes</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            CLP. Por barbería, sin importar el número de sillas.
          </p>

          <ul className="mt-6 space-y-3 text-left text-sm text-gray-700">
            <Bullet>Agenda ilimitada</Bullet>
            <Bullet>Reservas públicas online</Bullet>
            <Bullet>Clientes y servicios ilimitados</Bullet>
            <Bullet>Cobros con propina y métodos de pago</Bullet>
            <Bullet>Reportes y cierre de caja diario</Bullet>
            <Bullet>Acceso para barberos en su celular</Bullet>
            <Bullet>Soporte por WhatsApp</Bullet>
          </ul>

          <Link
            to="/register"
            className="mt-8 block w-full rounded-lg bg-brand py-3 text-center font-semibold text-white hover:bg-brand/90"
          >
            Probar 14 días gratis
          </Link>
          <p className="mt-3 text-xs text-gray-500">No pides tarjeta hasta el día 15.</p>
        </div>
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-green-600" aria-hidden>
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
