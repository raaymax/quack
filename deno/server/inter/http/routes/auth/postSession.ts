import { Res, Route } from "@planigale/planigale";
import { AccessDenied, TooManyLoginAttempts } from "../../errors.ts";
import { Core } from "../../../../core/mod.ts";
import { logAuthAttempt } from "../../authLog.ts";
import type { LoginLimiter } from "../../loginLimiter.ts";
import type { LoginOutcome } from "../../../../types.ts";
import { authCookieOptions } from "../../cookies.ts";
import { clientIp, trustedHops } from "../../clientIp.ts";

export default (core: Core, limiter: LoginLimiter) => {
  const hops = trustedHops(core.config.trustProxy);

  return new Route({
    public: true,
    method: "POST",
    url: "/session",
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string" },
          password: { type: "string" },
          legacyPassword: { type: "string" },
        },
      },
    },
    handler: async (req) => {
      if (!req.body) {
        return Res.json({ status: "error", message: "Invalid request" }, {
          status: 400,
        });
      }
      const ip = clientIp(req, hops);
      const log = (result: LoginOutcome) =>
        logAuthAttempt({
          kind: "login",
          result,
          ip,
          ua: req.headers["user-agent"],
          email: req.body.email,
        });

      let slot;
      try {
        slot = await limiter.acquire(ip);
      } catch (error) {
        if (error instanceof TooManyLoginAttempts) log("blocked");
        throw error;
      }

      let sessionId;
      try {
        sessionId = await core.dispatch({
          type: "session:create",
          body: {
            email: req.body.email,
            password: req.body.password,
            legacyPassword: req.body.legacyPassword,
          },
        });
      } catch (error) {
        await slot.finish(false);
        throw error;
      }
      await slot.finish(!sessionId);
      log(sessionId ? "success" : "failure");

      if (!sessionId) {
        throw new AccessDenied("Invalid login or password");
      }
      const session = await core.session.get({ id: sessionId });
      if (!session) {
        throw new AccessDenied("Invalid login or password");
      }
      const res = Res.json({ status: "ok", ...session });
      const cookieOpts = authCookieOptions(core);
      res.cookies.set("token", session.token, cookieOpts);
      return res;
    },
  });
};
