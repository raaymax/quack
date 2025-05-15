import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { Resizer } from "./Resizer.tsx";

const meta: Meta<typeof Resizer> = {
  component: Resizer,
};

export default meta;
type Story = StoryObj<typeof Resizer>;

export const Primary: Story = {
  args: {},
};
