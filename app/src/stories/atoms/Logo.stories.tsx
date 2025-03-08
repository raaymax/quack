import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Logo } from "../../js/components/atoms/Logo";

const meta: Meta<typeof Logo> = {
  component: Logo,
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Primary: Story = {
  args: {},
};
