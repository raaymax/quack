import { Res, Route } from "@planigale/planigale";
import { AccessDenied } from "../../errors.ts";
import { Core } from "../../../../core/mod.ts";
import { authCookieOptions } from "../../cookies.ts";

export default (core: Core) =>
  new Route({
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
      const sessionId = await core.dispatch({
        type: "session:create",
        body: {
          email: req.body.email,
          password: req.body.password,
          legacyPassword: req.body.legacyPassword,
        },
      });
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
