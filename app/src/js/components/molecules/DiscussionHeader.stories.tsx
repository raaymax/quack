import type { Meta, StoryObj } from "@storybook/react";

import { DiscussionHeader } from "./DiscussionHeader.tsx";

const meta: Meta<typeof DiscussionHeader> = {
  component: DiscussionHeader,
  title: "Molecules/DiscussionHeader",
  argTypes: {
    channelId: {
      control: "text",
      description: "ID of the channel to display header for",
    },
  },
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
