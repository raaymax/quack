import type { Meta, StoryObj } from "@storybook/react";

import { NavButton } from "./NavButton.tsx";

const meta: Meta<typeof NavButton> = {
  component: NavButton,
};

export default meta;
type Story = StoryObj<typeof NavButton>;

export const Primary: Story = {
  args: {
    children: "NavButton",
    icon: "hash",
  },
};
