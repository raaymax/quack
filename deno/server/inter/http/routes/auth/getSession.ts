import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { authCookieOptions } from "../../cookies.ts";
import { SESSION_TTL_SECONDS } from "../../../../core/session/constants.ts";

export default (core: Core) =>
  new Route({
    public: true,
    method: "GET",
    url: "/session",
    handler: async (req) => {
      if (req.state.session) {
        const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
        await core.repo.session.refresh(req.state.session.id, expires);

        const cookieOpts = authCookieOptions(core);
        const res = Res.json({
          ...req.state.session,
          user: req.state.user.id, // FIXME: remove
          status: "ok", // FIXME: remove
          key: req.cookies.get("key"),
        });
        res.cookies.set("token", req.state.session.token, cookieOpts);
        const key = req.cookies.get("key");
        if (key) {
          res.cookies.set("key", key, cookieOpts);
        }
        return res;
      }
      const res = Res.json({ status: "no-session" });
      if (req.cookies.get("token")) {
        res.cookies.delete("token", { path: "/" });
      }
      return res;
    },
  });
