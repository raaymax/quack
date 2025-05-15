import React from "react";
import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { Register } from "./pages/Register.tsx";
import { PasswordReset } from "./pages/PasswordReset.tsx";
import { Login } from "./pages/Login.tsx";
import { ThemeSelectorProvider } from "./contexts/theme.tsx";
import { observer } from "mobx-react-lite";

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

export const App = observer(() => {
  const url = new URL(window.location.toString());
  const { hash } = url;
  if (hash.startsWith("#/invite")) {
    return (
      <ThemeSelectorProvider>
        <Register />
      </ThemeSelectorProvider>
    );
  }

  if (hash.startsWith("#/reset")) {
    return (
      <ThemeSelectorProvider>
        <PasswordReset />
      </ThemeSelectorProvider>
    );
  }

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

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
