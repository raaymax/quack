import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ButtonWithIcon } from "./ButtonWithIcon.tsx";

const meta: Meta<typeof ButtonWithIcon> = {
  component: ButtonWithIcon,
};

export default meta;
type Story = StoryObj<typeof ButtonWithIcon>;

export const Primary: Story = {
  args: {
    icon: "star",
    children: "Button",
  },
};
