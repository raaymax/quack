import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ProfilePic } from "./ProfilePic.tsx";

const meta: Meta<typeof ProfilePic> = {
  component: ProfilePic,
};

export default meta;
type Story = StoryObj<typeof ProfilePic>;

export const Regular: Story = {
  args: {
    type: "regular",
    avatarUrl: "/avatar.png",
  },
};
export const Personal: Story = {
  args: {
    type: "personal",
    avatarUrl: "/avatar.png",
  },
};
export const PersonalStatusActive: Story = {
  args: {
    type: "personal",
    avatarUrl: "/avatar.png",
    showStatus: true,
    status: "active",
  },
};
export const PersonalStatusInactive: Story = {
  args: {
    type: "personal",
    avatarUrl: "/avatar.png",
    showStatus: true,
    status: "inactive",
  },
};
export const PersonalStatusAway: Story = {
  args: {
    type: "personal",
    avatarUrl: "/avatar.png",
    showStatus: true,
    status: "away",
  },
};

export const Status: Story = {
  args: {
    type: "status",
    avatarUrl: "/avatar.png",
  },
};

export const Tiny: Story = {
  args: {
    type: "tiny",
    avatarUrl: "/avatar.png",
  },
};
export const Reply: Story = {
  args: {
    type: "reply",
    avatarUrl: "/avatar.png",
  },
};
