export function LandingFAQ() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-10 text-center text-3xl font-bold text-brand">
          Preguntas frecuentes
        </h2>
        <div className="space-y-6 text-sm">
          <FAQ q="¿Necesito tarjeta de crédito para probar?">
            No. Las primeras 2 semanas son gratis, sin tarjeta. Si te sirve, pagas por
            transferencia y te activamos el mes.
          </FAQ>
          <FAQ q="¿Funciona en el celular?">
            Sí. La consola del dueño funciona en computadora o celular. Los barberos tienen
            una app dedicada para ver solo su día.
          </FAQ>
          <FAQ q="¿Mis clientes deben crear cuenta?">
            No. Tus clientes reservan en tu link público con nombre y teléfono, nada más.
          </FAQ>
          <FAQ q="¿Puedo importar mis citas de otra herramienta?">
            Hoy no. Estamos en versión inicial. Si lo necesitas, te ayudamos a migrar
            manualmente durante el onboarding.
          </FAQ>
          <FAQ q="¿Qué pasa si dejo de pagar?">
            Tus datos se quedan en pausa por 60 días. Si reactivas, los recuperas todos. Si
            no, se eliminan.
          </FAQ>
        </div>
      </div>
    </section>
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
