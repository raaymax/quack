import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Reactions } from "../../js/components/molecules/Reactions";
import { MessageModel } from "../../js/core/models/message.ts";
import { app } from "../../js/core";

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
