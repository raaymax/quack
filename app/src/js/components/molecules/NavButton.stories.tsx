import type { Meta, StoryObj } from "@storybook/react";

import { NavButton } from "./NavButton.tsx";

const meta: Meta<typeof NavButton> = {
  component: NavButton,
  title: "Molecules/NavButton",
  argTypes: {
    icon: {
      control: "select",
      options: ["hash", "user", "gear", "bell", "star", "folder"],
      description: "Icon to display",
    },
    size: {
      control: { type: "number", min: 30, max: 80, step: 5 },
      description: "Button size in pixels",
    },
    badge: {
      control: { type: "number", min: 0, max: 99 },
      description: "Badge count to display",
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
type Story = StoryObj<typeof NavButton>;

export const Default: Story = {
  args: {
    children: "NavButton",
    icon: "hash",
  },
};

export const WithBadge: Story = {
  args: {
    children: "Messages",
    icon: "bell",
    badge: 5,
  },
};

export const LargeBadge: Story = {
  args: {
    children: "Notifications",
    icon: "bell",
    badge: 99,
  },
};

export const CustomSize: Story = {
  args: {
    children: "Settings",
    icon: "gear",
    size: 60,
  },
};

export const UserIcon: Story = {
  args: {
    children: "Profile",
    icon: "user",
  },
};
