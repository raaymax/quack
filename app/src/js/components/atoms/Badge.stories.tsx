import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "./Badge.tsx";

const meta: Meta<typeof Badge> = {
  component: Badge,
  title: "Atoms/Badge",
  argTypes: {
    children: {
      control: "text",
      description: "Badge content (typically a number or short text)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "5",
  },
};

export const LargeNumber: Story = {
  args: {
    children: "99+",
  },
};

export const Text: Story = {
  args: {
    children: "New",
  },
};
