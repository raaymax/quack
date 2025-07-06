import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { Button } from "./Button.tsx";

const meta: Meta<typeof Button> = {
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    size: 30,
    type: "primary",
    children: "Button",
  },
};

export const Secondary: Story = {
  args: {
    size: 30,
    children: "Button",
  },
};
