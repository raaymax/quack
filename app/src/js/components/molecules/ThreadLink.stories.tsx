import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ThreadLink } from "./ThreadLink.tsx";

const meta: Meta<typeof ThreadLink> = {
  component: ThreadLink,
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
