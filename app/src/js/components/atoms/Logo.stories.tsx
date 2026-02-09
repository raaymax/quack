import type { Meta, StoryObj } from "@storybook/react";

import { Logo, LogoPic } from "./Logo.tsx";

const meta: Meta<typeof Logo> = {
  component: Logo,
  title: "Atoms/Logo",
  argTypes: {
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  args: {},
};

export const LogoPicSmall: StoryObj<typeof LogoPic> = {
  render: (args) => <LogoPic {...args} />,
  args: {
    size: 32,
  },
  argTypes: {
    size: {
      control: { type: "number", min: 16, max: 128, step: 8 },
      description: "Logo size in pixels",
    },
    onClick: {
      action: "clicked",
    },
  },
};

export const LogoPicLarge: StoryObj<typeof LogoPic> = {
  render: (args) => <LogoPic {...args} />,
  args: {
    size: 64,
  },
};
