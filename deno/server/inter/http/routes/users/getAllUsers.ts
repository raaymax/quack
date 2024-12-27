import { Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { User } from "../../../../types.ts";

export default (core: Core) =>
  new Route({
    method: "GET",
    url: "/",
    handler: async () => {
      const users = await core.user.getAll({});
      return Response.json(users.map((u: Partial<User>) => ({
        id: u.id,
        alias: u.alias,
        email: u.email,
        name: u.name,
        avatarFileId: u.avatarFileId,
        status: u.status,
        publicKey: u.publicKey,
      })));
    },
  });
