import type { Meta, StoryObj } from "@storybook/react";

import { Tooltip } from "./Tooltip.tsx";

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  title: "Atoms/Tooltip",
  argTypes: {
    text: {
      control: "text",
      description: "Tooltip text (string or array of strings for multiple lines)",
    },
    children: {
      control: "text",
      description: "Content that triggers the tooltip on hover",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    text: "This is a tooltip",
    children: "Hover over me",
  },
};

export const MultiLine: Story = {
  args: {
    text: ["Line 1", "Line 2", "Line 3"],
    children: "Hover for multi-line tooltip",
  },
};

export const OnButton: Story = {
  render: () => (
    <Tooltip text="Click to submit">
      <button style={{ padding: "8px 16px" }}>Submit</button>
    </Tooltip>
  ),
};
