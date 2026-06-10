import { Link } from 'react-router-dom';

export function LandingHero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-28">
      <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-brand-accent">
        <span>🇨🇱 Hecho para barberías en Chile</span>
      </div>
      <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-brand sm:text-5xl">
        Tu barbería ordenada, sin Excel ni cuadernos.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
        Agenda, cobros, clientes y reportes en un solo lugar. Tus clientes reservan online y
        tú cobras en segundos. Empieza hoy, sin tarjeta.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/register"
          className="w-full rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white hover:bg-brand/90 sm:w-auto"
        >
          Probar 14 días gratis
        </Link>
        <a
          href="#beneficios"
          className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-brand hover:bg-gray-50 sm:w-auto"
        >
          Ver cómo funciona
        </a>
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Sin tarjeta. Sin compromisos. Cancela cuando quieras.
      </p>
    </section>
  );
}
