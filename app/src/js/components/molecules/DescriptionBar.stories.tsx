import type { Meta, StoryObj } from "@storybook/react";

import { DescriptionBar } from "./DescriptionBar.tsx";
import { app } from "../../core/index.ts";

const meta: Meta<typeof DescriptionBar> = {
  component: DescriptionBar,
  title: "Molecules/DescriptionBar",
  parameters: {
    layout: "padded",
  },
  loaders: [
    async () => {
      app.channels.upsert({
        id: "channel-with-desc",
        name: "general",
        channelType: "PUBLIC",
        users: [],
        description: "This is the general channel for team discussions.",
      });
      app.channels.upsert({
        id: "channel-long-desc",
        name: "announcements",
        channelType: "PUBLIC",
        users: [],
        description:
          "This is a channel with a very long description that should be truncated when collapsed. It contains important information about company announcements, policy updates, and other critical communications that everyone should be aware of. Click to expand and read the full description.",
      });
      app.channels.upsert({
        id: "channel-no-desc",
        name: "random",
        channelType: "PUBLIC",
        users: [],
      });
    },
  ],
  argTypes: {
    channelId: {
      control: "select",
      options: ["channel-with-desc", "channel-long-desc", "channel-no-desc"],
      description: "ID of the channel to display description for",
    },
  },
};

export default meta;
type Story = StoryObj<typeof DescriptionBar>;

export const Default: Story = {
  args: {
    channelId: "channel-with-desc",
  },
};

export const LongDescription: Story = {
  args: {
    channelId: "channel-long-desc",
  },
};

export const NoDescription: Story = {
  args: {
    channelId: "channel-no-desc",
  },
};
