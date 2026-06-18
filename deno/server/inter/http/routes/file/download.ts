import { ApiError, Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { EntityId } from "../../../../types.ts";

export default (core: Core) =>
  new Route({
    method: "GET",
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
      query: {
        type: "object",
        properties: {
          download: { type: "boolean" },
          w: { type: "number" },
          h: { type: "number" },
        },
      },
    },
    handler: async (req) => {
      const userId = req.state.user.id;
      const { channelId, fileId } = req.params;
      await core.channel.access({ id: channelId, userId }).internal();

      const entity = await core.repo.file.get({ id: EntityId.from(fileId) });
      if (
        !entity ||
        entity.channelId.toString() !== channelId ||
        entity.status === "deleted"
      ) {
        throw new ApiError(404, "FILE_NOT_FOUND", "File not found");
      }

      const file = await core.storage.get(entity.storageId, {
        width: req.query.w,
        height: req.query.h,
      });
      const res = new Res();
      res.body = file.stream;
      res.headers.set("Content-Type", file.contentType);
      res.headers.set("Content-Length", file.size.toString());
      if (req.query.download) {
        res.headers.set(
          "Content-Disposition",
          `attachment; filename="${entity.fileName}"`,
        );
      }
      return res;
    },
  });
