import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import { ChannelType } from "../../../../../types.ts";

const { app, repo, core } = createApp();

Deno.test("/api/channels/direct/:userId", async () => {
  await repo.channel.removeMany({ channelType: ChannelType.DIRECT });
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const member = Chat.init(repo, agent);
    const admin = Chat.init(repo, agent);

    try {
      await member.login("member")
        .connectSSE();

      await admin
        .login("admin")
        .putDirectChannel({ userId: member.userIdR })
        .sendMessage({ flat: "hello" });

      await member
        .nextEvent((event, chat) => {
          assertEquals(event.type, "message");
          assertEquals(event.flat, "hello");
          chat.channelId = event.channelId as string;
          chat.state.directChannelId = event.channelId;
        })
        .getMessages({}, (messages) => {
          assertEquals(messages.length, 1);
          assertEquals(messages[0].flat, "hello");
        })
        .openDirectChannel({ userId: admin.userIdR }, (channel, { state }) => {
          assertEquals(channel.id, admin.channelIdR);
          assertEquals(channel.id, state.directChannelId);
        });
    } finally {
      await member.end();
      await admin.end();
    }
  });
});

Deno.test("/api/channels/direct/:userId - self channel", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const admin = Chat.init(repo, agent)
      .login("admin")
      .putDirectChannel(
        (chat) => ({ userId: chat.userIdR }),
        (channel, chat) => {
          chat.state.channelId = channel.id;
        },
      )
      .sendMessage({ flat: "hello" })
      .openDirectChannel(
        (chat) => ({ userId: chat.userIdR }),
        (channel, chat) => {
          assertEquals(channel.id, chat.state.channelId);
        },
      )
      .getChannel((channel, chat) => {
        assertEquals(channel.users.length, 1);
        assertEquals(channel.users[0], chat.userIdR);
      });

    await admin.end();
  });
});
