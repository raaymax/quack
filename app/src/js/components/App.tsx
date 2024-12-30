import { createRoot } from "react-dom/client";
import { Suspense, lazy } from "react";
import { Register } from "./pages/Register";
import { PasswordReset } from "./pages/PasswordReset";
import { Login } from "./pages/Login";
import { ThemeSelectorProvider } from "./contexts/theme";

declare global {
  interface Navigator {
    virtualKeyboard: {
      overlaysContent: boolean;
    };
  }
}

const Secured = lazy(() => import("./Secured"));

if ("virtualKeyboard" in navigator) {
  navigator.virtualKeyboard.overlaysContent = true;
}

export const App = () => {
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
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
