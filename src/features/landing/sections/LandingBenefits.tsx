export function LandingBenefits() {
  return (
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
  );
}

function BenefitCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-3 text-3xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="text-lg font-semibold text-brand">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
    </div>
  );
}
