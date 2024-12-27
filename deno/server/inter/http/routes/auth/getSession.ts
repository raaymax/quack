import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (_core: Core) =>
  new Route({
    public: true,
    method: "GET",
    url: "/session",
    handler: (req) => {
      if (req.state.session) {
        const res = Res.json({
          ...req.state.session,
          user: req.state.user.id, // FIXME: remove
          status: "ok", // FIXME: remove
          key: req.cookies.get("key")
        });
        res.cookies.set("token", req.state.session.token, {
          httpOnly: true,
          path: "/",
        });
        return res;
      }
      const res = Res.json({ status: "no-session" });
      if (req.cookies.get("token")) {
        res.cookies.delete("token", { path: "/" });
      }
      return res;
    },
  });
