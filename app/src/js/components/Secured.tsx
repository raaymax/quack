import { useEffect } from "react";
import "../setup.ts";
import { app, client } from "../core/index.ts";
import { useLoggedUserId } from "./contexts/useLoggedUserId.ts";
import { Router } from "./Router.tsx";
import { TooltipProvider } from "./contexts/tooltip.tsx";
import { observer } from "mobx-react-lite";
import { AppProvider } from "./contexts/appState.tsx";

const Secured = observer(() => {
  const user = useLoggedUserId();
  useEffect(() => {
    client.emit("auth:user", user);
  }, [user]);

  return (
    <AppProvider value={app}>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </AppProvider>
  );
});

export default Secured;
