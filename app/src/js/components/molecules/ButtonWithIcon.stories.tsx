import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { ButtonWithIcon } from "../../js/components/molecules/ButtonWithIcon";

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
