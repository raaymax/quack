import * as v from "valibot";
import { createCommand } from "../command.ts";
import { repo } from "../../infra/mod.ts";
import { Id, IdArr } from "../types.ts";
import { bus } from "../bus.ts";

enum ChannelType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  DIRECT = "DIRECT",
}

export default createCommand({
  type: "channel:create",
  body: v.required(
    v.object({
      userId: Id,
      channelType: v.optional(v.enum_(ChannelType), ChannelType.PUBLIC),
      name: v.string(),
      users: v.optional(IdArr, []),
    }),
    ["userId", "name"],
  ),
}, async (channel) => {
  const { channelType, userId, users, name } = channel;
  if (channelType === "PUBLIC" || channelType === "PRIVATE") {
    const existing = await repo.channel.get({ channelType, name, userId });
    if (existing) {
      return existing.id;
    }
  }
  if (channelType === "DIRECT") {
    const existing = await repo.channel.get({
      channelType,
      users: [userId, ...users],
    });
    if (existing) {
      return existing.id;
    }
  }

  const channelId = await repo.channel.create({
    name,
    channelType,
    private: (channelType === "PRIVATE" || channelType === "DIRECT"),
    direct: (channelType === "DIRECT"),
    users: (channelType === "DIRECT" ? [userId, ...users] : [userId]),
  });

  const created = await repo.channel.get({ id: channelId });
  bus.group(channel.users, {
    type: "channel",
    payload: created,
  });

  return channelId;
});