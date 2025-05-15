import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { EmojiSearch } from "./EmojiSearch.tsx";
import { app } from "../../core/index.ts";

const meta: Meta<typeof EmojiSearch> = {
  component: EmojiSearch,
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
