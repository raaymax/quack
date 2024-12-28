import { ApiError, Res, Route } from "@planigale/planigale";
import type { Storage } from "../../../core/mod.ts";

export const download = (storage: Storage) =>
  new Route({
    method: "GET",
    url: "/:fileId",
    schema: {
      params: {
        type: "object",
        required: ["fileId"],
        properties: {
          fileId: {
            type: "string",
          },
        },
      },
      query: {
        type: "object",
        properties: {
          download: {
            type: "boolean",
          },
          w: {
            type: "number",
          },
          h: {
            type: "number",
          },
        },
      },
    },
    handler: async (req) => {
      try {
        const file = await storage.get(req.params.fileId, {
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
            `attachment; filename="${file.filename}"`,
          );
        }
        return res;
      } catch (e) {
        if (e instanceof ApiError && e.errorCode === "FILE_NOT_FOUND") {
          const res = new Res();
          res.body = {
            errorCode: "RESOURCE_NOT_FOUND",
            message: "Specified file not found or does not exist",
          };
          res.status = 404;
          return res;
        }
        throw e;
      }
    },
  });
