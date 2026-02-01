import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { NavUserButton } from "./NavUsers.tsx";

const meta: Meta<typeof NavUserButton> = {
  component: NavUserButton,
  argTypes: {
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof NavUserButton>;

export const Default: Story = {
  args: {
    user: {
      id: "1",
      name: "John Doe",
      connected: true,
      status: "active",
    },
    badge: null,
  },
};

export const WithAvatar: Story = {
  args: {
    user: {
      id: "1",
      name: "Jane Smith",
      connected: true,
      status: "active",
      avatarFileId: "avatar-1",
    },
    badge: null,
  },
};

export const Offline: Story = {
  args: {
    user: {
      id: "1",
      name: "Offline User",
      connected: false,
      status: "inactive",
    },
    badge: null,
  },
};

export const Away: Story = {
  args: {
    user: {
      id: "1",
      name: "Away User",
      connected: true,
      status: "away",
    },
    badge: null,
  },
};

export const RecentlyActive: Story = {
  args: {
    user: {
      id: "1",
      name: "Recent User",
      connected: false,
      status: "inactive",
      lastSeen: new Date().toISOString(),
    },
    badge: null,
  },
};

export const WithBadge: Story = {
  args: {
    user: {
      id: "1",
      name: "User with Messages",
      connected: true,
      status: "active",
    },
    badge: { count: 5 } as any,
  },
};

export const SystemUser: Story = {
  args: {
    user: {
      id: "system",
      name: "System Bot",
      system: true,
    },
    badge: null,
  },
};

export const CustomSize: Story = {
  args: {
    user: {
      id: "1",
      name: "Large Avatar",
      connected: true,
      status: "active",
    },
    size: 40,
    badge: null,
  },
};

export const Active: Story = {
  args: {
    user: {
      id: "1",
      name: "Selected User",
      connected: true,
      status: "active",
    },
    badge: null,
    className: { active: true },
  },
};
