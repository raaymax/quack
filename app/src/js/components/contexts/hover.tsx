import { createContext, useState } from "react";

export const HoverContext = createContext<
  [(string | null), ((val: string | null) => void)] | undefined
>(undefined);

type HoverContextProps = {
  children: React.ReactNode;
};

export const HoverProvider = ({ children }: HoverContextProps) => {
  const hovered = useState<string | null>(null);
  return (
    <HoverContext.Provider value={hovered}>
      {children}
    </HoverContext.Provider>
  );
};
