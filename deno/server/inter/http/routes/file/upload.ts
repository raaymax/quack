import { Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { serialize } from "../../../../core/serializer.ts";
import { EntityId } from "../../../../types.ts";
import { toClientFile } from "../../../../core/file/clientFile.ts";

export default (core: Core) =>
  new Route({
    method: "POST",
    url: "/",
    public: false,
    schema: {
      params: {
        type: "object",
        required: ["channelId"],
        properties: {
          channelId: { type: "string", format: "entity-id" },
        },
      },
    },
    handler: async (req) => {
      const userId = req.state.user.id;
      const { channelId } = req.params;
      const disposition = req.headers["content-disposition"] ?? "";
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i);
      const fileName = (match?.[1] ?? "file")
        .replace(/[\r\n"\\/]/g, "_")
        .slice(0, 255);
      const contentType = req.headers["content-type"] ??
        "application/octet-stream";
      const size = parseInt(req.headers["content-length"] ?? "0", 10);

      await core.channel.access({ id: channelId, userId }).internal();

      const storageId = await core.storage.upload(req.body, {
        filename: fileName,
        contentType,
        size,
      });
      const meta = await core.storage.stat(storageId);

      const id = await core.dispatch({
        type: "file:register",
        body: {
          channelId,
          userId,
          storageId,
          fileName,
          contentType,
          size: meta.size,
          resolution: meta.resolution ?? null,
        },
      }).internal() as EntityId;

      const file = await core.repo.file.get({ id });
      return Response.json({
        status: "ok",
        file: serialize(toClientFile(file!)),
      });
    },
  });
