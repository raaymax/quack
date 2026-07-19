import type { Meta, StoryObj } from "@storybook/react";

import { NavChannels } from "./NavChannels.tsx";

const meta: Meta<typeof NavChannels> = {
  component: NavChannels,
  title: "Molecules/NavChannels",
};

export default meta;
type Story = StoryObj<typeof NavChannels>;

export const Default: Story = {
  args: {},
};
