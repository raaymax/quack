import type { Meta, StoryObj } from "@storybook/react";
import { SectionHeader } from "./SectionHeader";

const meta: Meta<typeof SectionHeader> = {
  component: SectionHeader,
  title: "Atoms/SectionHeader",
  argTypes: {
    title: {
      control: "text",
      description: "Section title",
    },
    actionIcon: {
      control: "text",
      description: "Icon name for action button",
    },
    onAction: {
      description: "Callback when action button is clicked",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const Default: Story = {
  args: {
    title: "channels",
  },
};

export const WithAction: Story = {
  args: {
    title: "channels",
    actionIcon: "plus",
    onAction: () => alert("Action clicked"),
  },
};

export const UsersSection: Story = {
  args: {
    title: "users",
  },
};
