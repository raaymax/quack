import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { DiscussionHeader } from "../../js/components/molecules/DiscussionHeader";
import { AppModel } from "../../js/core/models/app.ts";
import { AppProvider } from "../../js/components/contexts/appState.tsx";

const app = new AppModel();
import { client } from "app/src/js/core/client.ts";

const meta: Meta<typeof DiscussionHeader> = {
  component: DiscussionHeader,
  decorators: [
    (Story) => (
      <AppProvider value={app}>
        <Story />
      </AppProvider>
    ),
  ],
  loaders: [async () => {
    app.users.upsert({
      id: "123",
      name: "John Doe",
      email: "john@example.com",
      publicKey: {} as any,
      avatarFileId: "123",
    });
    app.users.upsert({
      id: "321",
      name: "Katie Doe",
      email: "katie@example.com",
      publicKey: {} as any,
      avatarFileId: "321",
    });

    client.api.userId = "123";

    app.channels.upsert({
      id: "public",
      name: "Channel Name",
      channelType: "PUBLIC",
      users: [],
    });

    app.channels.upsert({
      id: "private",
      name: "Private Channel Name",
      channelType: "PRIVATE",
      users: [],
    });

    app.channels.upsert({
      id: "direct",
      name: "Direct Channel Name",
      channelType: "DIRECT",
      users: [],
    });

    app.channels.upsert({
      id: "personal",
      name: "Personal Channel Name",
      channelType: "DIRECT",
      users: [],
    });
  }],
};

export default meta;
type Story = StoryObj<typeof DiscussionHeader>;

export const PublicChannel: Story = {
  args: {
    channelId: "public",
  },
};

export const PrivateChannel: Story = {
  args: {
    channelId: "private",
  },
};

export const DirectChannel: Story = {
  args: {
    channelId: "direct",
  },
};

export const PersonalChannel: Story = {
  args: {
    channelId: "personal",
  },
};
