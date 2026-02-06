import type { Meta, StoryObj } from "@storybook/react";

import { Emoji } from "./Emoji.tsx";

const meta: Meta<typeof Emoji> = {
  component: Emoji,
  title: "Molecules/Emoji",
  argTypes: {
    shortname: {
      control: "text",
      description: "Emoji shortname (e.g. :smile:)",
    },
    size: {
      control: { type: "number", min: 16, max: 64, step: 4 },
      description: "Emoji size in pixels",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Emoji>;

export const Smile: Story = {
  args: {
    shortname: ":smile:",
    size: 24,
  },
};

export const ThumbsUp: Story = {
  args: {
    shortname: ":thumbsup:",
    size: 24,
  },
};

export const ThumbsDown: Story = {
  args: {
    shortname: ":thumbsdown:",
    size: 24,
  },
};

export const Large: Story = {
  args: {
    shortname: ":smile:",
    size: 48,
  },
};
