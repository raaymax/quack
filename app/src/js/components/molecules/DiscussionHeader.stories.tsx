import type { Meta, StoryObj } from "@storybook/react";

import { DiscussionHeader } from "./DiscussionHeader.tsx";

const meta: Meta<typeof DiscussionHeader> = {
  component: DiscussionHeader,
};

export default meta;
type Story = StoryObj<typeof DiscussionHeader>;

export const PublicChannel: Story = {
  args: {
    channelId: "public",
  },
};

export const PrivateChannel: Story = {
  args: {
    channelId: "private",
  },
};

export const DirectChannel: Story = {
  args: {
    channelId: "direct",
  },
};
