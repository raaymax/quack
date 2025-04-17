import { createContext, useCallback, useState } from "react";
import { isMobile } from "../../utils.ts";

export type SidebarContextType = {
  sidebar: boolean;
  showSidebar: () => void;
  hideSidebar: () => void;
  toggleSidebar: () => void;
};

export const SidebarContext = createContext<SidebarContextType>({
  sidebar: true,
  showSidebar: () => {},
  hideSidebar: () => {},
  toggleSidebar: () => {},
});

type Props = {
  children: React.ReactNode;
};

function getDefault() {
  const stored = localStorage.getItem("sidebar");
  if (stored === "1") return true;
  if (stored === "0") return false;
  return !isMobile();
}

export const SidebarProvider = ({ children }: Props) => {
  const [sidebar, setSidebar] = useState<boolean>(getDefault());
  const set = useCallback((value: boolean) => {
    localStorage.setItem("sidebar", value ? "1" : "0");
    if (value !== sidebar) {
      setSidebar(value);
    }
  }, [sidebar, setSidebar]);

  const api = {
    sidebar,
    showSidebar: () => set(true),
    hideSidebar: () => set(false),
    toggleSidebar: () => set(!sidebar),
  };
  return (
    <SidebarContext.Provider value={api}>
      {children}
    </SidebarContext.Provider>
  );
};
