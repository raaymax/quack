import type { Meta, StoryObj } from "@storybook/react";

import { Image } from "./Image.tsx";

const meta: Meta<typeof Image> = {
  component: Image,
  title: "Atoms/Image",
  argTypes: {
    fileName: {
      control: "text",
      description: "Display name of the file",
    },
    src: {
      control: "text",
      description: "Image source URL",
    },
    downloadUrl: {
      control: "text",
      description: "URL to open on click",
    },
    size: {
      control: "number",
      description: "File size in bytes",
    },
    raw: {
      control: "boolean",
      description: "Whether to display at full size",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Image>;

export const Primary: Story = {
  args: {
    fileName: "image.jpg",
    src: "https://picsum.photos/200",
    size: 13000,
  },
};
export const Wide: Story = {
  args: {
    fileName: "wide-image.jpg",
    src: "https://picsum.photos/1200/100",
    size: 13000,
  },
};
export const Narrow: Story = {
  args: {
    fileName: "narrow-image.jpg",
    src: "https://picsum.photos/100/1200",
    size: 13000,
  },
};
export const Raw: Story = {
  args: {
    fileName: "animated.gif",
    src: "https://picsum.photos/200",
    size: 50000,
    raw: true,
  },
};
export const WithDownload: Story = {
  args: {
    fileName: "photo.jpg",
    src: "https://picsum.photos/200",
    downloadUrl: "https://picsum.photos/200",
    size: 25000,
  },
};
