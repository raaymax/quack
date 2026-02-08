import type { Meta, StoryObj } from "@storybook/react";

import { MessageInfo } from "./MessageInfo.tsx";
import { app } from "../../core/index.ts";
import { MessageModel } from "../../core/models/message.ts";

const meta: Meta<typeof MessageInfo> = {
  component: MessageInfo,
  title: "Molecules/MessageInfo",
  loaders: [async () => {
    app.channels.upsert({
      id: "test",
      name: "main",
      channelType: "PUBLIC",
      users: [],
    });
  }],
  argTypes: {
    messageModel: {
      control: false,
      description: "MessageModel instance",
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageInfo>;

const BaseMessage = {
  id: "321",
  secured: false as const,
  channelId: "main",
  userId: "123",
  createdAt: "2021-01-01T00:00:00Z",
  clientId: "123",
  flat: "Hello, world!",
  links: [],
  emojiOnly: false,
  reactions: [],
  mentions: [],
  thread: [],
  parsingErrors: [],
  attachments: [],
  linkPreviews: [],
  parentId: "",
  appId: "123",
  pinned: false,
  editing: false,
  updatedAt: "2021-01-01T00:00:00Z",
  message: {
    line: { text: "Hello, world!" },
  },
};

export const InfoMessage: Story = {
  args: {
    messageModel: MessageModel.from({
      ...BaseMessage,
      info: {
        type: "info",
        msg: "Message delivered",
      },
    }, app.getMessages("test")),
  },
};

export const ErrorMessage: Story = {
  args: {
    messageModel: MessageModel.from({
      ...BaseMessage,
      info: {
        type: "error",
        msg: "Sending message failed",
      },
    }, app.getMessages("test")),
  },
};

export const WithAction: Story = {
  args: {
    messageModel: MessageModel.from({
      ...BaseMessage,
      info: {
        type: "error",
        msg: "Sending message failed - click to retry",
        action: "resend",
      },
    }, app.getMessages("test")),
  },
};

export const NoInfo: Story = {
  args: {
    messageModel: MessageModel.from({
      ...BaseMessage,
    }, app.getMessages("test")),
  },
};
