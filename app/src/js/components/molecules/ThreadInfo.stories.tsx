import type { Meta, StoryObj } from "@storybook/react";

import { ThreadInfo } from "./ThreadInfo.tsx";

const meta: Meta<typeof ThreadInfo> = {
  component: ThreadInfo,
  title: "Molecules/ThreadInfo",
  argTypes: {
    msg: {
      control: "object",
      description: "Message object with thread replies",
    },
    navigate: {
      action: "navigate",
      description: "Called when thread link is clicked",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThreadInfo>;

export const SingleReply: Story = {
  args: {
    msg: {
      id: "msg-123",
      thread: [
        {
          childId: "child-1",
          userId: "you",
        },
      ],
      updatedAt: new Date().toISOString(),
      channelId: "channelId",
    },
  },
};

export const MultipleReplies: Story = {
  args: {
    msg: {
      id: "msg-456",
      thread: [
        {
          childId: "child-1",
          userId: "you",
        },
        {
          childId: "child-2",
          userId: "me",
        },
        {
          childId: "child-3",
          userId: "123",
        },
      ],
      updatedAt: new Date().toISOString(),
      channelId: "channelId",
    },
  },
};

export const SameUserReplies: Story = {
  args: {
    msg: {
      id: "msg-789",
      thread: [
        {
          childId: "child-1",
          userId: "you",
        },
        {
          childId: "child-2",
          userId: "you",
        },
        {
          childId: "child-3",
          userId: "you",
        },
      ],
      updatedAt: new Date().toISOString(),
      channelId: "channelId",
    },
  },
};
