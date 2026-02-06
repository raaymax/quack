import type { Meta, StoryObj } from "@storybook/react";

import { ThemeButton } from "./ThemeButton.tsx";

const meta: Meta<typeof ThemeButton> = {
  component: ThemeButton,
  title: "Atoms/ThemeButton",
  argTypes: {
    active: {
      control: "select",
      options: ["light", "dark", "system"],
      description: "Currently active theme",
    },
    onClick: {
      action: "clicked",
      description: "Click handler to cycle themes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeButton>;

const themes = {
  light: { name: "Light Mode", icon: "sun" },
  dark: { name: "Dark Mode", icon: "moon" },
  system: { name: "System", icon: "icons" },
};

export const Light: Story = {
  args: {
    themes,
    active: "light",
  },
};

export const Dark: Story = {
  args: {
    themes,
    active: "dark",
  },
};

export const System: Story = {
  args: {
    themes,
    active: "system",
  },
};
