import type { Meta, StoryObj } from "@storybook/react";

import { UserMention } from "./UserMention.tsx";

const meta: Meta<typeof UserMention> = {
  component: UserMention,
  title: "Molecules/UserMention",
  argTypes: {
    userId: {
      control: "text",
      description: "ID of the user being mentioned",
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserMention>;

export const Default: Story = {
  args: {
    userId: "you",
  },
};

export const AnotherUser: Story = {
  args: {
    userId: "me",
  },
};

export const UnknownUser: Story = {
  args: {
    userId: "unknown-user-id",
  },
};
