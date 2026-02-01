import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { BaseButton } from "./BaseButton.tsx";

const meta: Meta<typeof BaseButton> = {
  component: BaseButton,
  argTypes: {
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof BaseButton>;

export const Default: Story = {
  args: {
    children: "Click me",
    size: 40,
  },
};

export const Primary: Story = {
  args: {
    children: "Primary",
    type: "primary",
    size: 40,
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    type: "secondary",
    size: 40,
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
    size: 40,
  },
};

export const WithIcon: Story = {
  args: {
    children: <i className="fa-solid fa-check" />,
    size: 32,
  },
};

export const SmallSize: Story = {
  args: {
    children: "S",
    size: 24,
  },
};

export const LargeSize: Story = {
  args: {
    children: "Large Button",
    size: 48,
  },
};
