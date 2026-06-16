import type { Core } from "../../core/mod.ts";
import { SESSION_TTL_SECONDS } from "../../core/session/constants.ts";

export function authCookieOptions(core: Core) {
  return {
    httpOnly: true,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    sameSite: "Lax" as const,
    secure: core.config.baseUrl?.startsWith("https") ?? false,
  };
}
