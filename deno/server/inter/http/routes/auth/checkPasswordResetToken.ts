import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    public: true,
    method: "GET",
    url: "/password/:token",
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
      const user = await core.user.checkPasswordResetToken({ token: req.params.token });
      return Res.json({ valid: !!user, email: user?.email });
    },
  });
