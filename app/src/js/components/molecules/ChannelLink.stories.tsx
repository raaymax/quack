import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ChannelLink } from "./ChannelLink.tsx";
import { AppModel } from "../../core/models/app.ts";
import { AppProvider } from "../contexts/appState.tsx";

const app = new AppModel();

const meta: Meta<typeof ChannelLink> = {
  component: ChannelLink,
  decorators: [
    (Story) => (
      <AppProvider value={app}>
        <Story />
      </AppProvider>
    ),
  ],
  loaders: [async () => {
    app.channels.upsert({
      id: "channelId",
      name: "SuperChannel",
      users: [],
      channelType: "PUBLIC",
    });
  }],
};

export default meta;
type Story = StoryObj<typeof ChannelLink>;

export const Primary: Story = {
  args: {
    channelId: "channelId",
  },
};
