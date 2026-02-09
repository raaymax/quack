import type { Meta, StoryObj } from "@storybook/react";

import { LoggedUser } from "./LoggedUser.tsx";

const meta: Meta<typeof LoggedUser> = {
  component: LoggedUser,
  title: "Molecules/LoggedUser",
  argTypes: {
    name: {
      control: "text",
      description: "User display name",
    },
    avatarUrl: {
      control: "text",
      description: "URL for user avatar image",
    },
    onLogout: {
      action: "logout clicked",
      description: "Called when logout button is clicked",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoggedUser>;

export const Default: Story = {
  args: {
    name: "John Doe",
  },
};

export const WithAvatar: Story = {
  args: {
    name: "Jane Smith",
    avatarUrl: "https://i.pravatar.cc/150?u=jane",
  },
};

export const LongName: Story = {
  args: {
    name: "Alexander Bartholomew Wellington III",
  },
};
