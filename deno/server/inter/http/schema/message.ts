export const messageSchema = {
  $id: "message",
  definitions: {
    body: {
      oneOf: [
        { $ref: "message#/definitions/array" },
        { $ref: "message#/definitions/bullet" },
        { $ref: "message#/definitions/ordered" },
        { $ref: "message#/definitions/item" },
        { $ref: "message#/definitions/codeblock" },
        { $ref: "message#/definitions/blockquote" },
        { $ref: "message#/definitions/code" },
        { $ref: "message#/definitions/line" },
        { $ref: "message#/definitions/br" },
        { $ref: "message#/definitions/text" },
        { $ref: "message#/definitions/bold" },
        { $ref: "message#/definitions/italic" },
        { $ref: "message#/definitions/underline" },
        { $ref: "message#/definitions/strike" },
        { $ref: "message#/definitions/img" },
        { $ref: "message#/definitions/link" },
        { $ref: "message#/definitions/emoji" },
        { $ref: "message#/definitions/channel" },
        { $ref: "message#/definitions/user" },
        { $ref: "message#/definitions/thread" },
        { $ref: "message#/definitions/encrypted" },
      ],
    },
    array: { type: "array", items: { $ref: "message#/definitions/body" } },
    bullet: {
      type: "object",
      required: ["bullet"],
      properties: { bullet: { $ref: "message#/definitions/body" } },
    },
    ordered: {
      type: "object",
      required: ["ordered"],
      properties: { ordered: { $ref: "message#/definitions/body" } },
    },
    item: {
      type: "object",
      required: ["item"],
      properties: { item: { $ref: "message#/definitions/body" } },
    },
    codeblock: {
      type: "object",
      required: ["codeblock"],
      properties: { codeblock: { type: "string" } },
    },
    blockquote: {
      type: "object",
      required: ["blockquote"],
      properties: { blockquote: { $ref: "message#/definitions/body" } },
    },
    code: {
      type: "object",
      required: ["code"],
      properties: { code: { type: "string" } },
    },
    line: {
      type: "object",
      required: ["line"],
      properties: { line: { $ref: "message#/definitions/body" } },
    },
    br: {
      type: "object",
      required: ["br"],
      properties: { br: { type: "boolean" } },
    },
    text: {
      type: "object",
      required: ["text"],
      properties: { text: { type: "string" } },
    },
    bold: {
      type: "object",
      required: ["bold"],
      properties: { bold: { $ref: "message#/definitions/body" } },
    },
    italic: {
      type: "object",
      required: ["italic"],
      properties: { italic: { $ref: "message#/definitions/body" } },
    },
    underline: {
      type: "object",
      required: ["underline"],
      properties: { underline: { $ref: "message#/definitions/body" } },
    },
    strike: {
      type: "object",
      required: ["strike"],
      properties: { strike: { $ref: "message#/definitions/body" } },
    },
    img: {
      type: "object",
      required: ["img"],
      properties: {
        img: { type: "string" },
        _alt: { type: "string" },
      },
    },
    link: {
      type: "object",
      required: ["link", "_href"],
      properties: {
        link: { $ref: "message#/definitions/body" },
        _href: { type: "string" },
      },
    },
    emoji: {
      type: "object",
      required: ["emoji"],
      properties: { emoji: { type: "string" } },
    },
    channel: {
      type: "object",
      required: ["channel"],
      properties: { channel: { type: "string", format: "entity-id" } },
    },
    user: {
      type: "object",
      required: ["user"],
      properties: { user: { type: "string", format: "entity-id" } },
    },
    thread: {
      type: "object",
      required: ["thread", "_channelId", "_parentId"],
      properties: {
        thread: { type: "string" },
        _channelId: { type: "string", format: "entity-id" },
        _parentId: { type: "string", format: "entity-id" },
      },
    },
    encrypted: {
      type: "object",
      required: ["encrypted", "_iv"],
      properties: {
        encrypted: { type: "string" },
        _iv: { type: "string" },
      },
    },
  },
};
