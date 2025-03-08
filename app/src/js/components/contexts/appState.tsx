import { createContext, useContext } from "react";
import { AppModel } from "../../core/models/app";

export const AppContext = createContext<AppModel | null>(null);

type HoverContextProps = {
  children: React.ReactNode;
  value: AppModel;
};

export const AppProvider = ({ children, value }: HoverContextProps) => {
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within a AppProvider");
  }
  return context;
};
