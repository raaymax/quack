import type { Meta, StoryObj } from "@storybook/react";

import { DateSeparator } from "./DateSeparator.tsx";

const meta: Meta<typeof DateSeparator> = {
  component: DateSeparator,
  title: "Atoms/DateSeparator",
  argTypes: {
    date: {
      control: "text",
      description: "ISO date string to display",
    },
  },
};

export default meta;
type Story = StoryObj<typeof DateSeparator>;

export const Today: Story = {
  args: {
    date: new Date().toISOString(),
  },
};

export const Yesterday: Story = {
  args: {
    date: new Date(Date.now() - 86400000).toISOString(),
  },
};

export const LastWeek: Story = {
  args: {
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
};
