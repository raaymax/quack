import type { Meta, StoryObj } from "@storybook/react";
import { TooltipTag } from "./TooltipTag";

const meta: Meta<typeof TooltipTag> = {
  component: TooltipTag,
  title: "Atoms/TooltipTag",
  argTypes: {
    children: {
      control: "text",
      description: "Tag content",
    },
    tooltip: {
      control: "object",
      description: "Tooltip text (string or array of strings)",
    },
    variant: {
      control: "select",
      options: ["default", "header"],
      description: "Visual variant",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TooltipTag>;

export const Default: Story = {
  args: {
    children: "E2EE",
    tooltip: "End-to-end encrypted",
    variant: "default",
  },
};

export const Header: Story = {
  args: {
    children: "E2EE",
    tooltip: [
      "Messages in this channel are encrypted",
      "using your password",
    ],
    variant: "header",
  },
};

export const MultilineTooltip: Story = {
  args: {
    children: "Secure",
    tooltip: [
      "First line of tooltip",
      "Second line of tooltip",
      "Third line of tooltip",
    ],
    variant: "default",
  },
};
