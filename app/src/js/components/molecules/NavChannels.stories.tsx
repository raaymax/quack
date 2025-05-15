import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { NavChannels } from "./NavChannels.tsx";

const meta: Meta<typeof NavChannels> = {
  component: NavChannels,
};

export default meta;
type Story = StoryObj<typeof NavChannels>;

export const Primary: Story = {
  args: {},
};
