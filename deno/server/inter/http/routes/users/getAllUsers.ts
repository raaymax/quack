import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { serializeUser } from "./_serializeUser.ts";
import { DbUser } from "../../../../types.ts";

export default (core: Core) =>
  new Route({
    method: "GET",
    url: "/",
    handler: async () => {
      const users = await core.user.getAll({});
      return Res.json(users.map((u: DbUser) => serializeUser(u)));
    },
  });
