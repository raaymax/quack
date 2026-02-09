import type { Meta, StoryObj } from "@storybook/react";

import { ButtonWithEmoji } from "./ButtonWithEmoji.tsx";

const meta: Meta<typeof ButtonWithEmoji> = {
  component: ButtonWithEmoji,
  title: "Molecules/ButtonWithEmoji",
  argTypes: {
    emoji: {
      control: "text",
      description: "Emoji shortname (e.g. :smile:)",
    },
    size: {
      control: { type: "number", min: 24, max: 64, step: 4 },
      description: "Button size in pixels",
    },
    children: {
      control: "text",
      description: "Button label text",
    },
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonWithEmoji>;

export const Smile: Story = {
  args: {
    emoji: ":smile:",
    children: "Happy",
    size: 32,
  },
};

export const ThumbsUp: Story = {
  args: {
    emoji: ":thumbsup:",
    children: "Like",
    size: 32,
  },
};

export const ThumbsDown: Story = {
  args: {
    emoji: ":thumbsdown:",
    children: "Dislike",
    size: 32,
  },
};
