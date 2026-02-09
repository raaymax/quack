import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { ChannelType } from "../../../../types.ts";

export default (core: Core) =>
  new Route({
    method: "PUT",
    url: "/direct/:userId",
    schema: {
      params: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "string", format: "entity-id" },
        },
      },
    },
    handler: async (req) => {
      const channelId = await core.dispatch({
        type: "channel:direct:put",
        body: {
          userIds: [
            req.state.user.id,
            req.params.userId,
          ],
        },
      });
      const channel = await core.channel.get({
        id: channelId!,
        userId: req.state.user.id,
      });
      return Res.json(channel);
    },
  });
