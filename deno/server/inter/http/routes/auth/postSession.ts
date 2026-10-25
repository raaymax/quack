import { Res, Route } from "@planigale/planigale";
import { AccessDenied } from "../../errors.ts";
import { Core } from "../../../../core/mod.ts";
import { AppError } from "../../../../core/errors.ts";
import type { LoginOutcome } from "../../../../types.ts";
import { authCookieOptions } from "../../cookies.ts";
import { clientIp, trustMatcher } from "../../clientIp.ts";

const outcomeOfError = (error: unknown): LoginOutcome | null => {
  if (!(error instanceof AppError)) return null;
  if (error.errorCode === "TOO_MANY_LOGIN_ATTEMPTS") return "blocked";
  if (error.errorCode === "PASSWORD_RESET_REQUIRED") return "reset_required";
  return null;
};

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
      const attempt = {
        email: req.body.email,
        ip: clientIp(req, isTrustedProxy),
        userAgent: req.headers["user-agent"],
      };
      const record = (outcome: LoginOutcome) =>
        core.dispatch({
          type: "loginAttempt:record",
          body: { ...attempt, outcome },
        });

      let sessionId;
      try {
        await core.loginAttempt.check(attempt);
        sessionId = await core.dispatch({
          type: "session:create",
          body: {
            email: req.body.email,
            password: req.body.password,
            legacyPassword: req.body.legacyPassword,
          },
        });
      } catch (error) {
        const outcome = outcomeOfError(error);
        if (outcome) await record(outcome);
        throw error;
      }
      await record(sessionId ? "success" : "failure");
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
