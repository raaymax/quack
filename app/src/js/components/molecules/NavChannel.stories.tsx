import type { Meta, StoryObj } from "@storybook/react";

import { InlineChannel } from "./NavChannel.tsx";

// Use InlineChannel for stories since NavChannel (alias for Channel)
// requires full app context with channels store
const meta: Meta<typeof InlineChannel> = {
  component: InlineChannel,
  title: "Molecules/NavChannel",
  argTypes: {
    id: {
      control: "text",
      description: "Channel ID",
    },
    children: {
      control: "text",
      description: "Channel name to display",
    },
    icon: {
      control: "text",
      description: "FontAwesome icon class",
    },
    secured: {
      control: "boolean",
      description: "Show E2EE tag for encrypted channels",
    },
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
  },
};

export default meta;
type Story = StoryObj<typeof InlineChannel>;

export const Default: Story = {
  args: {
    id: "channel-1",
    children: "general",
    icon: "fa-solid fa-hashtag",
  },
};

export const PrivateChannel: Story = {
  args: {
    id: "channel-2",
    children: "private-team",
    icon: "fa-solid fa-lock",
  },
};

export const DirectMessage: Story = {
  args: {
    id: "channel-3",
    children: "John Doe",
    icon: "fa-solid fa-user",
  },
};

export const SecuredChannel: Story = {
  args: {
    id: "channel-4",
    children: "encrypted-chat",
    icon: "fa-solid fa-hashtag",
    secured: true,
  },
};

export const LongName: Story = {
  args: {
    id: "channel-5",
    children: "this-is-a-very-long-channel-name-that-should-truncate",
    icon: "fa-solid fa-hashtag",
  },
};
