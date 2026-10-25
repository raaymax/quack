import { ApiError, Middleware } from "@planigale/planigale";
import type { Core } from "../../../core/mod.ts";
import { clientIp, trustMatcher } from "../clientIp.ts";

const SECRET_PATHS: [RegExp, string][] = [
  [/^\/api\/auth\/reset\/[^/]+/, "/api/auth/reset/:token"],
  [/^\/api\/users\/token\/[^/]+/, "/api/users/token/:token"],
  [/^\/api\/users\/(?!token(\/|$))[^/]+$/, "/api/users/:token"],
];

export const redactPath = (path: string) => {
  for (const [pattern, replacement] of SECRET_PATHS) {
    if (pattern.test(path)) return path.replace(pattern, replacement);
  }
  return path;
};

export const redactQuery = (search: string) =>
  search.replace(/([?&](?:token|password|secret)=)[^&]*/gi, "$1:redacted");

const responseBytes = (res: unknown) => {
  if (!(res instanceof Response)) return undefined;
  const length = Number(res.headers.get("content-length"));
  return res.headers.has("content-length") && Number.isFinite(length)
    ? length
    : undefined;
};

export const anonymousAccessLog = (core: Core): Middleware => {
  const isTrustedProxy = trustMatcher(core.config.trustProxy ?? false);

  return async (req, next) => {
    const start = Date.now();
    let status = 500;
    let bytes: number | undefined;
    try {
      const res = await next();
      status = res instanceof Response ? res.status : 200;
      bytes = responseBytes(res);
      return res;
    } catch (error) {
      if (error instanceof ApiError) status = error.status;
      throw error;
    } finally {
      if (!req.state.user) {
        const url = new URL(req.url);
        console.log(JSON.stringify({
          kind: "req",
          time: new Date(start).toISOString(),
          ip: clientIp(req, isTrustedProxy),
          method: req.method,
          path: redactPath(url.pathname),
          query: redactQuery(url.search),
          status,
          bytes,
          rt: (Date.now() - start) / 1000,
          ref: req.headers["referer"],
          ua: req.headers["user-agent"],
          dest: req.headers["sec-fetch-dest"],
          session: req.state.token ? "invalid" : "none",
        }));
      }
    }
  };
};
