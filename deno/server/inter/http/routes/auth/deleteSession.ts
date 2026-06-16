import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    method: "DELETE",
    url: "/session",
    handler: async (req) => {
      if (req.state.session) {
        await core.dispatch({
          type: "session:remove",
          body: {
            sessionId: req.state.session.id,
          },
        });
      }
      const res = Res.empty();
      res.cookies.delete("token", { path: "/" });
      res.cookies.delete("key", { path: "/" });
      return res;
    },
  });
