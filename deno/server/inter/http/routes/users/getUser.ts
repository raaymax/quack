import { Res, ResourceNotFound, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { serializeUser } from "./_serializeUser.ts";
import { DbUser } from "../../../../types.ts";

export default (core: Core) =>
  new Route({
    method: "GET",
    url: "/:userId",
    handler: async (req) => {
      const user: DbUser | null = await core.user.get({
        id: req.params.userId,
      });
      if (!user) {
        throw new ResourceNotFound("User not found");
      }
      return Res.json(serializeUser(user));
    },
  });
