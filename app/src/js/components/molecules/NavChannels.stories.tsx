import type { Meta, StoryObj } from "@storybook/react";

import { NavChannels } from "./NavChannels.tsx";

// Note: NavChannels requires app context (channels store, router, etc.)
// The channel list is seeded by the global storybook loaders.
const meta: Meta<typeof NavChannels> = {
  component: NavChannels,
  title: "Molecules/NavChannels",
};

export default meta;
type Story = StoryObj<typeof NavChannels>;

export const Default: Story = {
  args: {},
};
