import { Link } from 'react-router-dom';

export function LandingFooterCTA() {
  return (
    <section className="border-t border-gray-100 bg-brand py-16 text-white">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl font-bold">Empieza hoy. Ordena tu barbería mañana.</h2>
        <p className="mt-3 text-white/80">14 días gratis. Sin tarjeta. Sin compromisos.</p>
        <Link
          to="/register"
          className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-brand hover:bg-gray-100"
        >
          Crear mi cuenta
        </Link>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-gray-500 sm:flex-row">
        <p>© {new Date().getFullYear()} SillaPro · Antofagasta, Chile</p>
        <div className="flex gap-4">
          <Link to="/login" className="hover:text-brand">
            Iniciar sesión
          </Link>
          <Link to="/register" className="hover:text-brand">
            Crear cuenta
          </Link>
        </div>
      </div>
    </footer>
  );
}
