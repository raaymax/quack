import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "./Text.tsx";

const meta: Meta<typeof Text> = {
  component: Text,
  title: "Atoms/Text",
  argTypes: {
    children: {
      control: "text",
      description: "Text content to display",
    },
    size: {
      control: { type: "number", min: 12, max: 72, step: 4 },
      description: "Font size in pixels",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children: "Hello, World!",
  },
};

export const Small: Story = {
  args: {
    children: "Small text",
    size: 12,
  },
};

export const Large: Story = {
  args: {
    children: "Large text",
    size: 32,
  },
};

export const Heading: Story = {
  args: {
    children: "Heading Style",
    size: 48,
  },
};
