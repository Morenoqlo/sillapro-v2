import { createContext, useContext, useState, type ReactNode } from 'react';

interface ContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<ContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCommandPalette(): ContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCommandPalette must be inside CommandPaletteProvider');
  return v;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}
