import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { NavChannel } from "./NavChannel.tsx";

const meta: Meta<typeof NavChannel> = {
  component: NavChannel,
};

export default meta;
type Story = StoryObj<typeof NavChannel>;

export const Primary: Story = {
  args: {
    channelId: "channelId",
  },
};
