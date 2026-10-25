import { Res, Route } from "@planigale/planigale";
import { AccessDenied } from "../../errors.ts";
import { Core } from "../../../../core/mod.ts";
import {
  PasswordResetRequired,
  TooManyLoginAttempts,
} from "../../../../core/errors.ts";
import { logAuthAttempt } from "../../../../core/loginAttempt/log.ts";
import type { LoginOutcome } from "../../../../types.ts";
import { authCookieOptions } from "../../cookies.ts";
import { clientIp, trustMatcher } from "../../clientIp.ts";

export default (core: Core) => {
  const isTrustedProxy = trustMatcher(core.config.trustProxy ?? false);

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
      const ip = clientIp(req, isTrustedProxy);
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
        slot = await core.loginLimiter.acquire(ip);
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
        if (error instanceof PasswordResetRequired) log("reset_required");
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
