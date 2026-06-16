import type { Core } from "../../core/mod.ts";
import { SESSION_TTL_SECONDS } from "../../core/session/constants.ts";

// Options for the auth cookies (`token`, `key`). Persistent (`maxAge`) so the
// login survives a browser/app restart instead of dying with the browser
// session — the previous behaviour, which logged users off constantly.
// `secure` is enabled only when the app is served over HTTPS so local HTTP
// development and tests still receive the cookies.
export function authCookieOptions(core: Core) {
  return {
    httpOnly: true,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    sameSite: "Lax" as const,
    secure: core.config.baseUrl?.startsWith("https") ?? false,
  };
}
