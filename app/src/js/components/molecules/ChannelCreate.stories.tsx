import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ChannelCreate } from "./ChannelCreate.tsx";

const meta: Meta<typeof ChannelCreate> = {
  component: ChannelCreate,
};

export default meta;
type Story = StoryObj<typeof ChannelCreate>;

export const Primary: Story = {
  args: {},
};
