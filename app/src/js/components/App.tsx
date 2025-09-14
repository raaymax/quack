import React from "react";
import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { Register } from "./pages/Register.tsx";
import { PasswordReset } from "./pages/PasswordReset.tsx";
import { Login } from "./pages/Login.tsx";
import { ThemeSelectorProvider } from "./contexts/theme.tsx";
import { observer } from "mobx-react-lite";
import { AppRouterProvider, useParams } from "./AppRouter.tsx";

declare global {
  interface Navigator {
    virtualKeyboard: {
      overlaysContent: boolean;
    };
  }
}

const Secured = lazy(() => import("./Secured.tsx"));

if ("virtualKeyboard" in navigator) {
  navigator.virtualKeyboard.overlaysContent = true;
}

// Component to handle route-based rendering
const AppContent = observer(() => {
  const params = useParams();

  // Handle special routes
  if (params.isInvite) {
    return (
      <ThemeSelectorProvider>
        <Register />
      </ThemeSelectorProvider>
    );
  }

  if (params.isReset) {
    return (
      <ThemeSelectorProvider>
        <PasswordReset />
      </ThemeSelectorProvider>
    );
  }

  // Default app route
  return (
    <ThemeSelectorProvider>
      <Login>
        <Suspense fallback={<div>loading page...</div>}>
          <Secured />
        </Suspense>
      </Login>
    </ThemeSelectorProvider>
  );
});

export const App = observer(() => {
  return (
    <AppRouterProvider>
      <AppContent />
    </AppRouterProvider>
  );
});

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
