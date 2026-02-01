import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { LoggedUser } from "./LoggedUser.tsx";

const meta: Meta<typeof LoggedUser> = {
  component: LoggedUser,
  argTypes: {
    onLogout: { action: "logout clicked" },
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
