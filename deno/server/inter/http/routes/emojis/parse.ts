export type EmojiUploadMeta = {
  filename: string;
  contentType: string;
  size: number;
};

export const EMOJI_PARAMS_SCHEMA = {
  type: "object",
  required: ["shortname"],
  properties: {
    shortname: { type: "string", pattern: "^:?[a-zA-Z0-9_+-]+:?$" },
  },
};

export function parseEmojiUpload(
  req: { headers: Record<string, string | undefined> },
): EmojiUploadMeta | Response {
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
