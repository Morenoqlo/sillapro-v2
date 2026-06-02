import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-brand">
            SillaPro
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <a href="#beneficios" className="hidden text-sm text-gray-600 hover:text-brand sm:inline">
              Cómo funciona
            </a>
            <a href="#precio" className="hidden text-sm text-gray-600 hover:text-brand sm:inline">
              Precio
            </a>
            <Link to="/login" className="text-sm text-gray-600 hover:text-brand">
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
            >
              Empezar gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-brand-accent">
          <span>🇨🇱 Hecho para barberías en Chile</span>
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-brand sm:text-5xl">
          Tu barbería ordenada, sin Excel ni cuadernos.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
          Agenda, cobros, clientes y reportes en un solo lugar. Tus clientes reservan online y tú
          cobras en segundos. Empieza hoy, sin tarjeta.
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
        <p className="mt-4 text-xs text-gray-500">Sin tarjeta. Sin compromisos. Cancela cuando quieras.</p>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-brand">Todo lo que necesitas para tu día</h2>
            <p className="mt-3 text-gray-600">3 herramientas que se conectan entre sí.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <BenefitCard
              emoji="📅"
              title="Agenda visual"
              desc="Ve todas las citas del día de un vistazo. Crea una cita en 10 segundos sin salir de la pantalla."
            />
            <BenefitCard
              emoji="💸"
              title="Cobros con propina"
              desc="Marca completada, registra el pago, anota la propina. 8 segundos por cliente. Cierre de caja al final del día."
            />
            <BenefitCard
              emoji="🌐"
              title="Reservas online 24/7"
              desc="Tu link público para Instagram y WhatsApp. Tus clientes reservan solos cuando tu local está cerrado."
            />
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-brand">Cómo funciona</h2>
            <p className="mt-3 text-gray-600">3 pasos para empezar.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              n={1}
              title="Crea tu cuenta"
              desc="Nombre de tu local, tus servicios, tus barberos. Te toma 3 minutos."
            />
            <StepCard
              n={2}
              title="Comparte tu link"
              desc="Cópialo a tu bio de Instagram. Tus clientes reservan online sin escribirte."
            />
            <StepCard
              n={3}
              title="Cobra y cierra el día"
              desc="Marca cada cita como pagada. Al final del día, cierra caja con un click."
            />
          </div>
        </div>
      </section>

      {/* Precio */}
      <section id="precio" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-brand">Un solo plan, todo incluido</h2>
          <p className="mt-3 text-gray-600">Sin sorpresas. Sin diferencias entre planes.</p>

          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-brand">$9.990</span>
              <span className="text-gray-500">/mes</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">CLP. Por barbería, sin importar el número de sillas.</p>

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

      {/* FAQ corto */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-10 text-center text-3xl font-bold text-brand">Preguntas frecuentes</h2>
          <div className="space-y-6 text-sm">
            <FAQ q="¿Necesito tarjeta de crédito para probar?">
              No. Las primeras 2 semanas son gratis, sin tarjeta. Si te sirve, pagas por
              transferencia y te activamos el mes.
            </FAQ>
            <FAQ q="¿Funciona en el celular?">
              Sí. La consola del dueño funciona en computadora o celular. Los barberos tienen una
              app dedicada para ver solo su día.
            </FAQ>
            <FAQ q="¿Mis clientes deben crear cuenta?">
              No. Tus clientes reservan en tu link público con nombre y teléfono, nada más.
            </FAQ>
            <FAQ q="¿Puedo importar mis citas de otra herramienta?">
              Hoy no. Estamos en versión inicial. Si lo necesitas, te ayudamos a migrar manualmente
              durante el onboarding.
            </FAQ>
            <FAQ q="¿Qué pasa si dejo de pagar?">
              Tus datos se quedan en pausa por 60 días. Si reactivas, los recuperas todos. Si no,
              se eliminan.
            </FAQ>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} SillaPro · Antofagasta, Chile</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-brand">Iniciar sesión</Link>
            <Link to="/register" className="hover:text-brand">Crear cuenta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BenefitCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-3 text-3xl" aria-hidden>{emoji}</div>
      <h3 className="text-lg font-semibold text-brand">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
    </div>
  );
}

function StepCard({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
        {n}
      </div>
      <h3 className="text-lg font-semibold text-brand">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-green-600" aria-hidden>✓</span>
      <span>{children}</span>
    </li>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-gray-200 bg-white p-4">
      <summary className="cursor-pointer list-none font-medium text-brand">
        <span className="inline-block transition-transform group-open:rotate-90">›</span>{' '}
        <span className="ml-1">{q}</span>
      </summary>
      <p className="mt-3 ml-5 text-gray-600">{children}</p>
    </details>
  );
}
