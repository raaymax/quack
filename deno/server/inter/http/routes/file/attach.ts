import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    method: "POST",
    url: "/:fileId/attach",
    public: false,
    schema: {
      params: {
        type: "object",
        required: ["channelId", "fileId"],
        properties: {
          channelId: { type: "string", format: "entity-id" },
          fileId: { type: "string", format: "entity-id" },
        },
      },
    },
    handler: async (req) => {
      const userId = req.state.user.id;
      const { channelId, fileId } = req.params;
      await core.channel.access({ id: channelId, userId }).internal();
      await core.dispatch({
        type: "file:attach",
        body: { fileIds: [fileId], channelId, userId },
      }).internal();
      return Res.json({ status: "ok" });
    },
  });
