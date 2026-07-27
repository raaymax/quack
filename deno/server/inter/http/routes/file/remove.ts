import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    method: "DELETE",
    url: "/:fileId",
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
      const { fileId } = req.params;
      await core.dispatch({
        type: "file:remove",
        body: { fileId, userId },
      });
      const res = new Res();
      res.status = 204;
      return res;
    },
  });
