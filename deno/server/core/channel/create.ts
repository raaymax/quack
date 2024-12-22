import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id, IdArr } from "../types.ts";
import { InvalidChannelValue } from "../errors.ts";
import { usersExists } from "./validate.ts";
import { ChannelType } from "../../types.ts";
import { generateChannelKey } from "../encryption.ts";

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
}, async (channel, core) => {
  const { repo, bus } = core;
  await usersExists(repo, channel.users);
  if (channel.channelType === ChannelType.DIRECT) {
    throw new InvalidChannelValue("Direct channel can't be created this way");
  }
  const {
    channelType,
    userId,
    users,
    name,
  } = channel;

  if (channelType === ChannelType.PRIVATE) {
    const existing = await repo.channel.get({ channelType, name, userId });
    if (existing) {
      return existing.id;
    }
  }

  if (channelType === ChannelType.PUBLIC) {
    const existing = await repo.channel.get({ channelType, name });
    if (existing) {
      await core.dispatch({
        type: "channel:join",
        body: {
          channelId: existing.id,
          userIds: [userId, ...users],
        },
      });
      return existing.id;
    }
  }

  const channelId = await repo.channel.create({
    name,
    channelType,
    private: channelType === "PRIVATE",
    direct: false,
    users: [userId, ...users],
    encrypted: false,
    encryptionKey: await generateChannelKey(),
  });

  const created = await repo.channel.get({ id: channelId });

  bus.group(created?.users ?? [], {
    type: "channel",
    ...created,
  });

  return channelId;
});
