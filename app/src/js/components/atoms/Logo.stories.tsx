import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { Logo } from "./Logo.tsx";

const meta: Meta<typeof Logo> = {
  component: Logo,
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Primary: Story = {
  args: {},
};
