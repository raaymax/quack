import type { Meta, StoryObj } from "@storybook/react";

import { ButtonWithEmoji } from "./ButtonWithEmoji.tsx";

const meta: Meta<typeof ButtonWithEmoji> = {
  component: ButtonWithEmoji,
};

export default meta;
type Story = StoryObj<typeof ButtonWithEmoji>;

export const Primary: Story = {
  args: {
    emoji: ":smile:",
    children: "Hello, World!",
  },
};

export const ThumbsUp: Story = {
  args: {
    emoji: ":thumbsup:",
    children: "Like this!",
  },
};
