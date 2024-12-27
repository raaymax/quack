import { Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (core: Core) =>
  new Route({
    method: "POST",
    url: "/",
    schema: {
      params: {
        type: "object",
        required: ["channelId"],
        properties: {
          channelId: { type: "string", format: "entity-id" },
        },
      },
      body: {
        type: "object",
        requireAny: ["message", "flat"],
        properties: {
          message: { $ref: "message#/definitions/body" },
          parentId: { type: "string", format: "entity-id" },
          flat: { type: "string" },
          clientId: { type: "string" },
          emojiOnly: { type: "boolean" },
          debug: { type: "string" },
          links: { type: "array", items: { type: "string" } },
          mentions: { type: "array", items: { type: "string" } },
          attachments: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "fileName"],
              properties: {
                id: { type: "string" },
                fileName: { type: "string" },
                contentType: {
                  type: "string",
                  default: "application/octet-stream",
                },
              },
            },
          },
        },
      },
    },
    handler: async (req) => {
      const userId = req.state.user.id;
      const { channelId } = req.params;

      const id = await core.dispatch({
        type: "message:create",
        body: { ...req.body, userId, channelId },
      });

      const msg = await core.message.get({ userId, messageId: id });
      return Response.json(msg);
    },
  });
