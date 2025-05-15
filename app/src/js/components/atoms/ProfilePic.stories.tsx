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
    userId: "1",
    type: "regular",
  },
};
export const Personal: Story = {
  args: {
    userId: "1",
    type: "personal",
  },
};
export const PersonalStatus: Story = {
  args: {
    userId: "1",
    type: "personal",
    showStatus: true,
  },
};

export const Status: Story = {
  args: {
    userId: "1",
    type: "status",
  },
};

export const Tiny: Story = {
  args: {
    userId: "1",
    type: "tiny",
  },
};
export const Reply: Story = {
  args: {
    userId: "1",
    type: "reply",
  },
};
