import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id, IdArr } from "../types.ts";
import { AccessDenied, InvalidMessage, ResourceNotFound } from "../errors.ts";
import { flatten } from "./flatten.ts";
import { ChannelType, EntityId } from "../../types.ts";
import { resolveFiles } from "../file/resolveFiles.ts";

function filterUndefined(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  );
}

export default createCommand({
  type: "message:create",
  body: v.required(
    v.object({
      userId: Id,
      message: v.optional(v.any()),
      encrypted: v.optional(v.string()),
      _iv: v.optional(v.string()),
      channelId: Id,
      parentId: v.optional(Id),
      flat: v.optional(v.string()),
      pinned: v.optional(v.boolean()),
      clientId: v.optional(v.string()),
      emojiOnly: v.optional(v.boolean(), false),
      debug: v.optional(v.string()),
      links: v.optional(v.array(v.string()), []),
      mentions: v.optional(IdArr, []),
      fileIds: v.optional(IdArr, []),
    }),
    ["userId", "channelId"],
  ),
}, async (msg, core) => {
  const { repo, bus } = core;
  const channel = await core.channel.access({
    id: msg.channelId,
    userId: msg.userId,
  }).internal();

  if (!msg.message && !msg.flat && !msg.encrypted) {
    throw new InvalidMessage("Message or flat must be provided");
  }

  if (msg.encrypted && !msg._iv) {
    throw new InvalidMessage("IV must be provided when message is encrypted");
  }

  if (!msg.message && msg.flat) {
    msg.message = { text: msg.flat };
  }
  if (msg.message && !msg.flat) {
    msg.flat = flatten(msg.message);
  }

  if (!msg.clientId) {
    msg.clientId = crypto.randomUUID();
  }
  const message = filterUndefined({
    encrypted: msg.encrypted,
    _iv: msg._iv,
    secured: !!msg.encrypted,
    message: msg.message,
    flat: msg.flat ?? "",
    pinned: msg.pinned,
    channelId: channel.id,
    parentId: msg.parentId,
    channel: channel.cid,
    clientId: msg.clientId,
    emojiOnly: msg.emojiOnly,
    userId: msg.userId,
    links: msg.links,
    mentions: msg.mentions,
    fileIds: msg.fileIds?.length ? msg.fileIds : undefined,
    createdAt: new Date(),
  });
  const id: EntityId = await (async () => {
    const existing = await repo.message.get({
      channelId: channel.id,
      userId: msg.userId,
      clientId: msg.clientId,
    });
    if (existing) {
      await repo.message.update({ id: existing.id }, message);
    } else {
      return await repo.message.create(message);
    }
    return existing.id;
  })();

  await core.dispatch({
    type: "channel:join",
    body: {
      channelId: msg.channelId.toString(),
      userIds: msg.mentions.filter((m) => !channel.users.some((u) => u.eq(m)))
        .map((u) => u.toString()),
    },
  }).internal();

  if (msg.fileIds?.length) {
    await core.dispatch({
      type: "file:attach",
      body: {
        fileIds: msg.fileIds.map((f) => f.toString()),
        messageId: id.toString(),
        channelId: channel.id.toString(),
        userId: msg.userId.toString(),
      },
    }).internal();
  }

  if (id && msg.parentId) {
    await repo.message.updateThread({
      id,
      parentId: msg.parentId,
      userId: msg.userId,
    });
    const parent = await repo.message.get({ id: msg.parentId });
    bus.group(channel.users, { type: "message", ...parent });
  }

  const created = await repo.message.getR({ id });
  await resolveFiles(repo, [created]);
  bus.group(channel.users, { type: "message", ...created });

  await core.dispatch({
    type: "readReceipt:update:message",
    body: {
      channelId: channel.id,
      parentId: msg.parentId,
      messageId: id,
      userId: msg.userId,
    },
  }).internal();

  await core.events.dispatch({
    type: "message:created",
    payload: created,
  });

  // await services.notifications.send(created, res);
  return id; // { id, duplicate: dup };
  /*
    if (msg.links?.length) {
      services.link.addPreview(
        { messageId: id, links: msg.links },
        { bus: res.bus },
      );
    }
    */
});
