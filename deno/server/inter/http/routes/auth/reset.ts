import { Res, Route } from "@planigale/planigale";
import { AppError, Core } from "../../../../core/mod.ts";
import { TooManyLoginAttempts } from "../../errors.ts";
import { logAuthAttempt } from "../../authLog.ts";
import type { LoginLimiter } from "../../loginLimiter.ts";
import type { LoginOutcome } from "../../../../types.ts";
import { clientIp, trustMatcher } from "../../clientIp.ts";

const REJECTED = new Set(["NO_ACCESS", "RESOURCE_NOT_FOUND"]);

export default (core: Core, limiter: LoginLimiter) => {
  const isTrustedProxy = trustMatcher(core.config.trustProxy ?? false);

  return new Route({
    public: true,
    method: "PUT",
    url: "/reset/:token",
    schema: {
      params: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string" },
        },
      },
      body: {
        type: "object",
        required: ["email", "password", "oldPassword", "publicKey", "secrets"],
        properties: {
          email: { type: "string" },
          password: { type: "string" },
          oldPassword: { type: "string" },
          publicKey: { type: "object" },
          secrets: {
            type: "object",
            required: ["encrypted", "_iv"],
            properties: {
              encrypted: { type: "string" },
              _iv: { type: "string" },
            },
          },
        },
      },
    },
    handler: async (req) => {
      const ip = clientIp(req, isTrustedProxy);
      const log = (result: LoginOutcome) =>
        logAuthAttempt({
          kind: "password_reset",
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

      try {
        await core.dispatch({
          type: "user:reset",
          body: {
            token: req.params.token,
            email: req.body.email,
            password: req.body.password,
            oldPassword: req.body.oldPassword,
            publicKey: req.body.publicKey,
            secrets: req.body.secrets,
          },
        });
      } catch (error) {
        const rejected = error instanceof AppError &&
          REJECTED.has(error.errorCode);
        await slot.finish(rejected);
        if (rejected) log("failure");
        throw error;
      }
      await slot.finish(false);
      log("success");
      return Res.json({ status: "ok" });
    },
  });
};
