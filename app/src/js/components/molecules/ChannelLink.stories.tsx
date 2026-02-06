import type { Meta, StoryObj } from "@storybook/react";

import { ChannelLink } from "./ChannelLink.tsx";

const meta: Meta<typeof ChannelLink> = {
  component: ChannelLink,
};

export default meta;
type Story = StoryObj<typeof ChannelLink>;

export const Public: Story = {
  args: {
    channelId: "channelId",
  },
};

export const Private: Story = {
  args: {
    channelId: "private",
  },
};

export const Unknown: Story = {
  args: {
    channelId: "unknown-channel",
  },
};
