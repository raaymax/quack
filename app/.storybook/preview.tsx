import type { Preview } from "@storybook/react";
import { ThemeSelectorProvider } from "../src/js/components/contexts/theme";
import { TooltipProvider } from "../src/js/components/contexts/tooltip";
import { app, client } from "../src/js/core";
import { AppProvider } from "../src/js/components/contexts/appState";

const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      values: [
        { name: "Dark", value: "var(--background-color)" },
        { name: "Light", value: "var(--background-color)" },
      ],
      default: "Dark",
    },
  },
  loaders: [async () => {
    client.api.userId = 'me';
    app.users.upsert({ id: 'me', name: 'John Doe', email: 'john@example.com', publicKey: {} as any, avatarFileId: '123' });
    app.users.upsert({ id: 'you', name: 'Katie Doe', email: 'katie@example.com', publicKey: {} as any, avatarFileId: '321' });
    app.users.upsert({ id: '123', name: 'Lindsay Smith', email: 'lindsey@example.com', publicKey: {} as any, avatarFileId: '123' });
    app.channels.upsert({ id: 'public', name: 'Channel Name', channelType: 'PUBLIC', users: ['me'] });
    app.channels.upsert({ id: 'private', name: 'Private Channel Name', channelType: 'PRIVATE', users: ['me'] });
    app.channels.upsert({ id: 'direct', name: 'Direct Channel Name', channelType: 'DIRECT', users: ['me'] });
    app.channels.upsert({ id: 'personal', name: 'Personal Channel Name', channelType: 'DIRECT', users: ['me'] });
    app.channels.upsert({ id: 'channelId', name: 'SuperChannel', users: [], channelType: 'PUBLIC' });
    app.channels.upsert({ id: 'channelId2', name: 'CoolThings', users: [], channelType: 'PUBLIC' });

    app.emojis.upsert({ empty: false, unicode: "😀", shortname: ":smile:", category: "people" });
    app.emojis.upsert({ empty: false, unicode: "👍", shortname: ":thumbsup:", category: "people" });
    app.emojis.upsert({ empty: false, unicode: "👎", shortname: ":thumbsdown:", category: "people" });

    app.readReceipts.upsert({ channelId: 'channelId', userId: 'me', count: 123, parentId: null, lastRead: new Date(), lastMessageId: '123', id: '123' });
  }],
  decorators: [
    (Story, args) => (
      <AppProvider value={app}>
        <ThemeSelectorProvider value={args.globals.theme}>
          <TooltipProvider>
            <Story />
          </TooltipProvider>
        </ThemeSelectorProvider>
      </AppProvider>
    ),
  ],
};

export default preview;
