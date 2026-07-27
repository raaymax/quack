import { Core } from "../../../../core/mod.ts";
import { EntityId } from "../../../../types.ts";

type EmojiUploadMeta = {
  filename: string;
  contentType: string;
  size: number;
};

type EmojiUploadReq = {
  body: ReadableStream<Uint8Array>;
  params: Record<string, string>;
  headers: Record<string, string | undefined>;
};

export const EMOJI_PARAMS_SCHEMA = {
  type: "object",
  required: ["shortname"],
  properties: {
    shortname: { type: "string", pattern: "^:?[a-zA-Z0-9_+-]+:?$" },
  },
};

function parseMeta(req: EmojiUploadReq): EmojiUploadMeta | Response {
  const contentType = req.headers["content-type"] ?? "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return Response.json(
      { errorCode: "INVALID_EMOJI", message: "expected an image" },
      { status: 400 },
    );
  }
  const disposition = req.headers["content-disposition"] ?? "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i);
  const filename = (match?.[1] ?? "emoji")
    .replace(/[\r\n"\\/]/g, "_")
    .slice(0, 255);
  const size = parseInt(req.headers["content-length"] ?? "0", 10);
  return { filename, contentType, size };
}

export async function saveEmojiUpload(
  core: Core,
  req: EmojiUploadReq,
  type: "emoji:create" | "emoji:replace",
): Promise<Response> {
  const meta = parseMeta(req);
  if (meta instanceof Response) return meta;

  const storageId = await core.storage.upload(req.body, meta);
  try {
    const id = await core.dispatch(
      {
        type,
        body: { shortname: req.params.shortname, storageId },
      } as Parameters<Core["dispatch"]>[0],
    ).internal() as EntityId;
    const emoji = await core.repo.emoji.get({ id });
    return Response.json({ status: "ok", emoji });
  } catch (e) {
    await core.storage.remove(storageId).catch(() => {});
    throw e;
  }
}
