import { createContext, useContext, useState, type ReactNode } from 'react';
import { ChargeableListModal } from '@/features/cobrar/ChargeableListModal';
import { ChargeAppointmentModal } from '@/features/cobrar/ChargeAppointmentModal';
import type { AppointmentWithRefs } from '@/features/citas/types';

interface ContextValue {
  openList: () => void;
  openFor: (appointment: AppointmentWithRefs) => void;
}

const Ctx = createContext<ContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCharge(): ContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCharge must be used inside ChargeProvider');
  return v;
}

type State =
  | { kind: 'closed' }
  | { kind: 'list' }
  | { kind: 'direct'; appointment: AppointmentWithRefs };

export function ChargeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: 'closed' });

  function close() {
    setState({ kind: 'closed' });
  }

  return (
    <Ctx.Provider
      value={{
        openList: () => setState({ kind: 'list' }),
        openFor: (appointment) => setState({ kind: 'direct', appointment }),
      }}
    >
      {children}
      {state.kind === 'list' && <ChargeableListModal onClose={close} />}
      {state.kind === 'direct' && (
        <ChargeAppointmentModal appointment={state.appointment} onClose={close} />
      )}
    </Ctx.Provider>
  );
}
