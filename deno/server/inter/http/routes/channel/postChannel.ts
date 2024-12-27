import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { ChannelType } from "../../../../types.ts";

export default (core: Core) =>
  new Route({
    method: "POST",
    url: "/",
    schema: {
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          channelType: {
            type: "string",
            enum: [ChannelType.DIRECT, ChannelType.PUBLIC, ChannelType.PRIVATE],
            default: ChannelType.PUBLIC,
          },
          encryptionKey: { type: "string" },
          users: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    handler: async (req) => {
      const channelId = await core.dispatch({
        type: "channel:create",
        body: {
          userId: req.state.user.id,
          name: req.body.name,
          channelType: req.body.channelType,
          users: req.body.users,
          encryptionKey: req.body.encryptionKey,
        },
      });
      const channel = await core.channel.get({
        id: channelId,
        userId: req.state.user.id,
      });
      return Res.json(channel);
    },
  });
