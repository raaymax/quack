import type { Meta, StoryObj } from "@storybook/react";

import { ThreadLink } from "./ThreadLink.tsx";

const meta: Meta<typeof ThreadLink> = {
  component: ThreadLink,
  title: "Molecules/ThreadLink",
  argTypes: {
    channelId: {
      control: "text",
      description: "ID of the channel containing the thread",
    },
    parentId: {
      control: "text",
      description: "ID of the parent message",
    },
    text: {
      control: "text",
      description: "Link text to display",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThreadLink>;

export const Default: Story = {
  args: {
    channelId: "channelId",
    parentId: "parentId123",
    text: "View thread",
  },
};

export const WithCustomText: Story = {
  args: {
    channelId: "channelId",
    parentId: "parentId123",
    text: "5 replies",
  },
};

export const EmptyText: Story = {
  args: {
    channelId: "channelId",
    parentId: "parentId123",
    text: "",
  },
};
