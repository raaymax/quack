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
    openUrl: {
      control: "text",
      description: "URL to open on click",
    },
    downloadUrl: {
      control: "text",
      description: "URL used by the download button",
    },
    size: {
      control: "number",
      description: "File size in bytes",
    },
    variant: {
      control: "radio",
      options: ["single", "tile"],
      description: "Large single preview or square gallery tile",
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
export const Tile: Story = {
  args: {
    fileName: "tile.jpg",
    src: "https://picsum.photos/400/300",
    size: 50000,
    variant: "tile",
  },
};
export const WithDownload: Story = {
  args: {
    fileName: "photo.jpg",
    src: "https://picsum.photos/200",
    openUrl: "https://picsum.photos/200",
    downloadUrl: "https://picsum.photos/200",
    size: 25000,
  },
};
