import React, { createContext, useContext, useMemo, useState } from 'react';

type SelectedRun = { week: number; run: number } | null;

type Ctx = {
  selected: SelectedRun;
  setSelected: (s: SelectedRun) => void;
};

const SelectedRunContext = createContext<Ctx | null>(null);

export function SelectedRunProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<SelectedRun>(null);
  const value = useMemo(() => ({ selected, setSelected }), [selected]);
  return (
    <SelectedRunContext.Provider value={value}>
      {children}
    </SelectedRunContext.Provider>
  );
}

export function useSelectedRun(): Ctx {
  const ctx = useContext(SelectedRunContext);
  if (!ctx)
    throw new Error('useSelectedRun must be used inside SelectedRunProvider');
  return ctx;
}
