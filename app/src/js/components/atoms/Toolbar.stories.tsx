import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { Toolbar } from "./Toolbar.tsx";

const meta: Meta<typeof Toolbar> = {
  component: Toolbar,
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Primary: Story = {
  args: {},
};
