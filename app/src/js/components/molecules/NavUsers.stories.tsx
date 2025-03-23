import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { NavUsers } from "./NavUsers.tsx";

const meta: Meta<typeof NavUsers> = {
  component: NavUsers,
};

export default meta;
type Story = StoryObj<typeof NavUsers>;

export const Primary: Story = {
  args: {},
};
