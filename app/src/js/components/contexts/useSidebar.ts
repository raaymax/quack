import { useContext } from "react";
import { SidebarContext, SidebarContextType } from "./sidebar.tsx";

export const useSidebar = (): SidebarContextType => {
  const sidebarControl = useContext(SidebarContext);
  if (!sidebarControl) {
    return {
      sidebar: true,
      showSidebar: () => {},
      hideSidebar: () => {},
      toggleSidebar: () => {},
    };
  }
  return sidebarControl;
};
