import { createContext } from "react";

export const SizeContext = createContext<number | undefined>(undefined);

type SizeContextProps = {
  value?: number;
  children: React.ReactNode;
};

export const SizeProvider = ({ children, value }: SizeContextProps) => (
  <SizeContext.Provider value={value}>
    {children}
  </SizeContext.Provider>
);
