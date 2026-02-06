import type { Meta, StoryObj } from "@storybook/react";

import { ButtonWithIcon } from "./ButtonWithIcon.tsx";

const meta: Meta<typeof ButtonWithIcon> = {
  component: ButtonWithIcon,
  title: "Molecules/ButtonWithIcon",
  argTypes: {
    icon: {
      control: "select",
      options: ["star", "edit", "delete", "reply", "send", "plus", "xmark", "search"],
      description: "Icon to display",
    },
    size: {
      control: { type: "number", min: 24, max: 64, step: 4 },
      description: "Button size in pixels",
    },
    iconSize: {
      control: { type: "number", min: 12, max: 32, step: 2 },
      description: "Icon size (defaults to half of button size)",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
    tooltip: {
      control: "text",
      description: "Tooltip text on hover",
    },
    children: {
      control: "text",
      description: "Button label text",
    },
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonWithIcon>;

export const Default: Story = {
  args: {
    icon: "star",
    children: "Favorite",
    size: 32,
  },
};

export const IconOnly: Story = {
  args: {
    icon: "edit",
    size: 32,
  },
};

export const WithTooltip: Story = {
  args: {
    icon: "delete",
    tooltip: "Delete item",
    size: 32,
  },
};

export const Disabled: Story = {
  args: {
    icon: "send",
    children: "Send",
    disabled: true,
    size: 32,
  },
};
