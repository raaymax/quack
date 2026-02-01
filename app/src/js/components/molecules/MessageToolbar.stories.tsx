import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { MessageToolbar } from "./MessageToolbar.tsx";
import { MessageModel } from "../../core/models/message.ts";
import { app } from "../../core/index.ts";

// Helper to create message model at render time (after loaders run)
const createMessageModel = (overrides: any) => {
  return MessageModel.from(
    {
      id: "msg-1",
      userId: "me",
      flat: "Hello, world!",
      message: { text: "Hello, world!" },
      channelId: "toolbar-test",
      ...overrides,
    },
    app.getMessages("toolbar-test"),
  );
};

const meta: Meta<typeof MessageToolbar> = {
  component: MessageToolbar,
};

export default meta;
type Story = StoryObj<typeof MessageToolbar>;

export const Default: Story = {
  render: () => (
    <MessageToolbar
      navigate={(path: string) => console.log("Navigate to:", path)}
      messageModel={createMessageModel({})}
    />
  ),
};

export const OtherUserMessage: Story = {
  render: () => (
    <MessageToolbar
      navigate={(path: string) => console.log("Navigate to:", path)}
      messageModel={createMessageModel({
        id: "msg-2",
        userId: "you",
        flat: "Hello from another user!",
        message: { text: "Hello from another user!" },
      })}
    />
  ),
};

export const PinnedMessage: Story = {
  render: () => (
    <MessageToolbar
      navigate={(path: string) => console.log("Navigate to:", path)}
      messageModel={createMessageModel({
        id: "msg-3",
        flat: "This is pinned!",
        message: { text: "This is pinned!" },
        pinned: true,
      })}
    />
  ),
};
