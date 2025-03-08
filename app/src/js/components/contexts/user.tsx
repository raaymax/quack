import { createContext } from "react";

export const UserContext = createContext<string | null>(null);

type UserContextProps = {
  children: React.ReactNode;
  value: string | null;
};

export const UserProvider = ({ children, value }: UserContextProps) => (
  <UserContext.Provider value={value}>
    {children}
  </UserContext.Provider>
);
