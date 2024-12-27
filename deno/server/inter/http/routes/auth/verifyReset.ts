import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    public: true,
    method: "GET",
    url: "/reset/:token",
    schema: {
      params: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string" },
        },
      },
    },
    handler: async (req) => {
      const user = await core.user.verifyUserReset({
        token: req.params.token,
      });
      return Res.json({ valid: !!user, email: user?.email });
    },
  });
