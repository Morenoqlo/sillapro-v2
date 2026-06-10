export function LandingHowItWorks() {
  return (
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
