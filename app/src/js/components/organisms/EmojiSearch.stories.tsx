import type { Meta, StoryObj } from "@storybook/react";

import { EmojiSearch } from "./EmojiSearch.tsx";
import { app, client } from "../../core/index.ts";

const meta: Meta<typeof EmojiSearch> = {
  component: EmojiSearch,
  title: "Organisms/EmojiSearch",
  parameters: {},
  loaders: [async () => {
    app.emojis.load();
  }],
};

export default meta;
type Story = StoryObj<typeof EmojiSearch>;

export const Primary: Story = {
  args: {},
  render: (args) => <EmojiSearch {...args} />,
};

export const AddEmoji: Story = {
  args: {},
  loaders: [async () => {
    app.emojis.load();
    client.api.createEmoji = async (shortname: string, file: File) => {
      const emoji = {
        shortname,
        fileId: URL.createObjectURL(file),
        category: "c",
        empty: false,
      };
      return emoji as never;
    };
  }],
  render: (args) => <EmojiSearch {...args} />,
};
