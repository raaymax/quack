import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    method: "PATCH",
    url: "/:messageId",
    schema: {
      params: {
        type: "object",
        required: ["messageId"],
        properties: {
          messageId: { type: "string", format: "entity-id" },
        },
      },
      body: {
        type: "object",
        properties: {
          pinned: { type: "boolean" },
          message: { $ref: "message#/definitions/body" },
          parentId: { type: "string", format: "entity-id" },
          flat: { type: "string" },
          clientId: { type: "string" },
          emojiOnly: { type: "boolean" },
          debug: { type: "string" },
          links: { type: "array", items: { type: "string" } },
          mentions: { type: "array", items: { type: "string" } },
        },
      },
    },
    handler: async (req) => {
      const userId = req.state.user.id;

      const ret = await core.dispatch({
        type: "message:update",
        body: {
          id: req.params.messageId,
          userId,
          data: req.body,
        },
      });
      return Res.empty();
    },
  });
