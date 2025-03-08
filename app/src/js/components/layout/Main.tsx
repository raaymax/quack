import { lazy } from "react";
import { isMobile } from "../../utils";
import { SidebarProvider } from "../contexts/sidebar";

const Mobile = lazy(() => import("./Mobile"));
const Desktop = lazy(() => import("./Desktop"));

export const Main = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      {isMobile() ? <Mobile>{children}</Mobile> : <Desktop>{children}</Desktop>}
    </SidebarProvider>
  );
};
