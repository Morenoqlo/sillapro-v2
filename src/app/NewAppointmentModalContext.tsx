import { createContext, useContext, useState, type ReactNode } from 'react';
import { NewAppointmentModal, type PrefilledSlot } from '@/features/citas/NewAppointmentModal';

interface ContextValue {
  open: (prefilled?: PrefilledSlot) => void;
}

const Ctx = createContext<ContextValue | null>(null);

export function useNewAppointment(): ContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNewAppointment must be used inside NewAppointmentProvider');
  return v;
}

export function NewAppointmentProvider({ children }: { children: ReactNode }) {
  const [openWith, setOpenWith] = useState<PrefilledSlot | null>(null);
  const isOpen = openWith !== null;

  return (
    <Ctx.Provider value={{ open: (prefilled) => setOpenWith(prefilled ?? {}) }}>
      {children}
      {isOpen && (
        <NewAppointmentModal
          appointment={null}
          prefilled={openWith ?? undefined}
          onClose={() => setOpenWith(null)}
        />
      )}
    </Ctx.Provider>
  );
}
