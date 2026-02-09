import type { Meta, StoryObj } from "@storybook/react";

import { TextWithIcon } from "./TextWithIcon.tsx";

const meta: Meta<typeof TextWithIcon> = {
  component: TextWithIcon,
  title: "Molecules/TextWithIcon",
  argTypes: {
    icon: {
      control: "text",
      description: "Icon name or FontAwesome class",
    },
    size: {
      control: { type: "number", min: 20, max: 60, step: 5 },
      description: "Size in pixels for icon and text",
    },
    children: {
      control: "text",
      description: "Text content to display",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextWithIcon>;

export const Default: Story = {
  args: {
    icon: "star",
    children: "Hello, World!",
  },
};

export const HashIcon: Story = {
  args: {
    icon: "hash",
    children: "general",
  },
};

export const LockIcon: Story = {
  args: {
    icon: "lock",
    children: "private-channel",
  },
};

export const UserIcon: Story = {
  args: {
    icon: "user",
    children: "John Doe",
  },
};

export const CustomSize: Story = {
  args: {
    icon: "bell",
    children: "Notifications",
    size: 40,
  },
};
