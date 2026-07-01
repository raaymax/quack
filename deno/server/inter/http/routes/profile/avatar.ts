import { Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";
import { EntityId } from "../../../../types.ts";
import { serializeUser } from "../users/_serializeUser.ts";

type AvatarUploadMeta = {
  filename: string;
  contentType: string;
  size: number;
};

function parseMeta(
  req: { headers: Record<string, string | undefined> },
): AvatarUploadMeta | Response {
  const contentType = req.headers["content-type"] ?? "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return Response.json(
      { errorCode: "INVALID_AVATAR", message: "expected an image" },
      { status: 400 },
    );
  }
  const disposition = req.headers["content-disposition"] ?? "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i);
  const filename = (match?.[1] ?? "avatar")
    .replace(/[\r\n"\\/]/g, "_")
    .slice(0, 255);
  const size = parseInt(req.headers["content-length"] ?? "0", 10);
  return { filename, contentType, size };
}

export default (core: Core) =>
  new Route({
    method: "PUT",
    url: "/avatar",
    public: false,
    handler: async (req) => {
      const meta = parseMeta(req);
      if (meta instanceof Response) return meta;

      const userId = req.state.user.id;
      const storageId = await core.storage.upload(req.body, meta);
      try {
        await core.dispatch(
          {
            type: "user:setAvatar",
            body: { id: userId, storageId },
          } as Parameters<Core["dispatch"]>[0],
        ).internal();
        const user = await core.repo.user.getR({ id: EntityId.from(userId) });
        return Response.json({ status: "ok", user: serializeUser(user) });
      } catch (e) {
        await core.storage.remove(storageId).catch(() => {});
        throw e;
      }
    },
  });
