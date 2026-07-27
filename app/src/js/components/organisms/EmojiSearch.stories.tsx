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
    const fakeEmoji = (shortname: string, file: File) =>
      ({
        shortname,
        fileId: URL.createObjectURL(file),
        category: "c",
        empty: false,
      }) as never;
    client.api.createEmoji = async (shortname: string, file: File) =>
      fakeEmoji(shortname, file);
    client.api.replaceEmoji = async (shortname: string, file: File) =>
      fakeEmoji(shortname, file);
  }],
  render: (args) => <EmojiSearch {...args} />,
};
