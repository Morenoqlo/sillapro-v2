import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StepIndicator } from './StepIndicator';
import { ShopStep } from './ShopStep';
import { BarberStep } from './BarberStep';
import { ServiceStep } from './ServiceStep';
import { useCreateInitialShop } from './hooks/useCreateInitialShop';
import type { ShopInput, BarberInput, ServiceInput } from './schemas';

export function OnboardingPage() {
  const navigate = useNavigate();
  const mutation = useCreateInitialShop();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shop, setShop] = useState<ShopInput | null>(null);
  const [barber, setBarber] = useState<BarberInput | null>(null);

  function handleShop(values: ShopInput) {
    setShop(values);
    setStep(2);
  }
  function handleBarber(values: BarberInput) {
    setBarber(values);
    setStep(3);
  }
  async function handleService(values: ServiceInput) {
    if (!shop || !barber) return;
    try {
      await mutation.mutateAsync({ shop, barber, service: values });
      toast.success('¡Listo! Bienvenido a SillaPro');
      navigate('/admin/hoy', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la barbería';
      toast.error(message);
    }
  }

  const labels = ['Local', 'Barbero', 'Servicio'];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-brand">SillaPro</h1>
        <p className="mb-6 text-center text-sm text-gray-600">Vamos a configurar tu barbería</p>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <StepIndicator current={step} total={3} labels={labels} />
          {step === 1 && (
            <ShopStep {...(shop ? { defaultValues: shop } : {})} onSubmit={handleShop} />
          )}
          {step === 2 && (
            <BarberStep
              {...(barber ? { defaultValues: barber } : {})}
              onSubmit={handleBarber}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <ServiceStep
              onSubmit={handleService}
              onBack={() => setStep(2)}
              submitting={mutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
