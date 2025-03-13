import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Resizer } from "../../js/components/atoms/Resizer";

const meta: Meta<typeof Resizer> = {
  component: Resizer,
};

export default meta;
type Story = StoryObj<typeof Resizer>;

export const Primary: Story = {
  args: {},
};
