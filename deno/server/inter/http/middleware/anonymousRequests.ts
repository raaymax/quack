import { ApiError, Middleware } from "@planigale/planigale";
import type { Core } from "../../../core/mod.ts";
import { clientIp, trustMatcher } from "../clientIp.ts";

const MAX_HEADER_VALUE = 1024;
const MAX_HEADERS = 64;
const MAX_BODY = 4096;
const MAX_QUERY = 2048;
const SECRET_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "x-api-key",
]);
const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SECRET_BODY_PATHS = [/^\/api\/auth(\/|$)/, /^\/api\/users(\/|$)/];
const SECRET_PATHS: [RegExp, string][] = [
  [/^\/api\/auth\/reset\/[^/]+/, "/api/auth/reset/:token"],
  [/^\/api\/users\/token\/[^/]+/, "/api/users/token/:token"],
  [/^\/api\/users\/(?!token(\/|$))[^/]+$/, "/api/users/:token"],
];

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…[${value.length}]` : value;

export const redactPath = (path: string) => {
  for (const [pattern, replacement] of SECRET_PATHS) {
    if (pattern.test(path)) return path.replace(pattern, replacement);
  }
  return path;
};

const redactQuery = (search: string) =>
  truncate(
    search.replace(/([?&](?:token|password|secret)=)[^&]*/gi, "$1:redacted"),
    MAX_QUERY,
  );

const headersOf = (raw: Record<string, string>) => {
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw).slice(0, MAX_HEADERS)) {
    if (SECRET_HEADERS.has(name)) {
      headers[name] = `:redacted[${value.length}]`;
    } else if (name === "cookie") {
      headers[name] = value.split(";").map((part) => part.split("=")[0].trim())
        .filter(Boolean).map((cookie) => `${cookie}=:redacted`).join("; ");
    } else {
      headers[name] = truncate(value, MAX_HEADER_VALUE);
    }
  }
  return headers;
};

const bodySample = (method: string, path: string, body: unknown) => {
  if (!BODY_METHODS.has(method)) return undefined;
  if (SECRET_BODY_PATHS.some((pattern) => pattern.test(path))) return undefined;
  if (typeof body === "string") return truncate(body, MAX_BODY);
  if (
    body === null || typeof body !== "object" || body instanceof ReadableStream
  ) {
    return undefined;
  }
  try {
    return truncate(JSON.stringify(body), MAX_BODY);
  } catch {
    return undefined;
  }
};

const optional = <T>(key: string, value: T | undefined | "") =>
  value === undefined || value === "" ? {} : { [key]: value };

export const anonymousRequests = (core: Core): Middleware => {
  const isTrustedProxy = trustMatcher(core.config.trustProxy ?? false);

  return async (req, next) => {
    const start = Date.now();
    let status = 500;
    let errorCode: string | undefined;
    try {
      const res = await next();
      status = res instanceof Response ? res.status : 200;
      return res;
    } catch (error) {
      if (error instanceof ApiError) {
        status = error.status;
        errorCode = error.errorCode;
      }
      throw error;
    } finally {
      if (!req.state.user && core.anonymousRequests.enabled) {
        const url = new URL(req.url);
        const path = redactPath(url.pathname);
        const contentLength = Number(req.headers["content-length"]);
        core.anonymousRequests.record({
          createdAt: new Date(start),
          ip: clientIp(req, isTrustedProxy),
          peer: req.ip.hostname,
          ...optional("forwardedFor", req.headers["x-forwarded-for"]),
          method: req.method,
          ...optional("host", req.headers["host"]),
          path,
          ...optional("query", url.search && redactQuery(url.search)),
          ...optional("route", req.route?.definition.url),
          status,
          ...optional("errorCode", errorCode),
          durationMs: Date.now() - start,
          session: req.state.token ? "invalid" : "none",
          ...optional("userAgent", req.headers["user-agent"]),
          ...optional("referer", req.headers["referer"]),
          ...optional("origin", req.headers["origin"]),
          ...optional("acceptLanguage", req.headers["accept-language"]),
          ...optional("contentType", req.headers["content-type"]),
          ...optional(
            "contentLength",
            Number.isFinite(contentLength) ? contentLength : undefined,
          ),
          headers: headersOf(req.headers),
          ...optional("body", bodySample(req.method, path, req.body)),
        });
      }
    }
  };
};
