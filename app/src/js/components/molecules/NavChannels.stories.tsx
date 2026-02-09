import type { Meta, StoryObj } from "@storybook/react";

import { NavChannels } from "./NavChannels.tsx";

// Note: NavChannels requires app context (channels store, router, etc.)
// Stories will render the container structure but channel list requires context
const meta: Meta<typeof NavChannels> = {
  component: NavChannels,
  title: "Molecules/NavChannels",
  argTypes: {
    icon: {
      control: "text",
      description: "Default icon for channels (FontAwesome class or icon name)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavChannels>;

export const Default: Story = {
  args: {},
};

export const CustomIcon: Story = {
  args: {
    icon: "fa-solid fa-folder",
  },
};
