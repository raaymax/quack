import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./Button.tsx";

const meta: Meta<typeof Button> = {
  component: Button,
  title: "Molecules/Button",
  argTypes: {
    type: {
      control: "select",
      options: ["primary", "secondary", "other"],
      description: "Button style variant",
    },
    size: {
      control: { type: "number", min: 20, max: 60, step: 5 },
      description: "Button size in pixels",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
    tooltip: {
      control: "text",
      description: "Tooltip text shown on hover",
    },
    children: {
      control: "text",
      description: "Button content",
    },
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    type: "primary",
    size: 30,
    children: "Submit",
  },
};

export const Secondary: Story = {
  args: {
    type: "secondary",
    size: 30,
    children: "Cancel",
  },
};

export const Disabled: Story = {
  args: {
    type: "primary",
    size: 30,
    children: "Disabled",
    disabled: true,
  },
};

export const WithTooltip: Story = {
  args: {
    type: "primary",
    size: 30,
    children: "Hover me",
    tooltip: "This is a tooltip",
  },
};
