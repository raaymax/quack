import { ResourceNotFound, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { User } from "../../../../types.ts";

export default (core: Core) =>
  new Route({
    method: "GET",
    url: "/:userId",
    handler: async (req) => {
      const user: Partial<User> | null = await core.user.get({
        id: req.params.userId,
      });
      if (!user) {
        throw new ResourceNotFound("User not found");
      }
      return Response.json({
        id: user.id,
        alias: user.alias,
        email: user.email,
        name: user.name,
        avatarFileId: user.avatarFileId,
        status: user.status,
        publicKey: user.publicKey,
      });
    },
  });
