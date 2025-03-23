import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { Reactions } from "./Reactions.tsx";
import { MessageModel } from "../../core/models/message.ts";
import { app } from "../../core/index.ts";

const meta: Meta<typeof Reactions> = {
  component: Reactions,
  loaders: [async () => {
    app.channels.upsert({
      id: "test",
      name: "test",
      channelType: "PUBLIC",
      users: [],
    });
  }],
};

export default meta;
type Story = StoryObj<typeof Reactions>;

export const Primary: Story = {
  args: {
    messageModel: MessageModel.from({
      flat: "hello",
      message: { text: "hello" },
      reactions: [
        { userId: "me", reaction: "👍" },
        { userId: "you", reaction: "👎" },
      ],
    }, app.getMessages("test")),
  },
};
export const WithAddButton: Story = {
  args: {
    messageModel: MessageModel.from({
      flat: "hello",
      message: { text: "hello" },
      reactions: [
        { userId: "me", reaction: "👍" },
        { userId: "you", reaction: "👎" },
      ],
    }, app.getMessages("test")),
    onClick: () => {},
  },
};
