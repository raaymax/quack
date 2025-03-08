import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { NavUsers } from "../../js/components/molecules/NavUsers";

const meta: Meta<typeof NavUsers> = {
  component: NavUsers,
};

export default meta;
type Story = StoryObj<typeof NavUsers>;

export const Primary: Story = {
  args: {},
};
