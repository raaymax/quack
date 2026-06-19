import { Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { EntityId } from "../../../../types.ts";

export default (core: Core) =>
  new Route({
    method: "PUT",
    url: "/:shortname",
    public: false,
    schema: {
      params: {
        type: "object",
        required: ["shortname"],
        properties: {
          shortname: { type: "string", pattern: "^:?[a-zA-Z0-9_+-]+:?$" },
        },
      },
    },
    handler: async (req) => {
      const { shortname } = req.params;
      const disposition = req.headers["content-disposition"] ?? "";
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i);
      const fileName = (match?.[1] ?? "emoji")
        .replace(/[\r\n"\\/]/g, "_")
        .slice(0, 255);
      const contentType = req.headers["content-type"] ??
        "application/octet-stream";
      if (!contentType.startsWith("image/")) {
        return Response.json(
          { errorCode: "INVALID_EMOJI", message: "expected an image" },
          { status: 400 },
        );
      }
      const size = parseInt(req.headers["content-length"] ?? "0", 10);

      const storageId = await core.storage.upload(req.body, {
        filename: fileName,
        contentType,
        size,
      });

      const id = await core.dispatch({
        type: "emoji:replace",
        body: { shortname, storageId },
      }).internal() as EntityId;

      const emoji = await core.repo.emoji.get({ id });
      return Response.json({ status: "ok", emoji });
    },
  });
