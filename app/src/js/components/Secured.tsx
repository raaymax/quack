import { useEffect } from "react";
import "../setup";
import { client } from "../core";
import StoreProvider from "../store/components/provider";
import { useLoggedUserId } from "./contexts/useLoggedUserId";
import { Router } from "./Router";
import { TooltipProvider } from "./contexts/tooltip";
import { observer } from "mobx-react-lite";
import { app } from "../core";
import { AppProvider } from "./contexts/appState";

const Secured = observer(() => {
  const user = useLoggedUserId();
  useEffect(() => {
    client.emit("auth:user", user);
  }, [user]);

  return (
    <StoreProvider>
      <AppProvider value={app}>
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </AppProvider>
    </StoreProvider>
  );
});

export default Secured;
