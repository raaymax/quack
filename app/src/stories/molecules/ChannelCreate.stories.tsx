import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { ChannelCreate } from "../../js/components/molecules/ChannelCreate";

const meta: Meta<typeof ChannelCreate> = {
  component: ChannelCreate,
};

export default meta;
type Story = StoryObj<typeof ChannelCreate>;

export const Primary: Story = {
  args: {},
};
