import { Res, Route } from "@planigale/planigale";
import { AccessDenied } from "../../errors.ts";
import { Core } from "../../../../core/mod.ts";

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
          key: { type: "string" },
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
        },
      });
      if (!sessionId) {
        throw new AccessDenied("Invalid login or password");
      }
      const session = await core.session.get({ id: sessionId });
      if (!session) {
        throw new AccessDenied("Invalid login or password");
      }
      const res = Res.json({ status: "ok", ...session, key: req.body.key });
      res.cookies.set("token", session.token, { httpOnly: true, path: "/" });
      res.cookies.set("key", req.body.key, { httpOnly: true, path: "/" });
      return res;
    },
  });
