import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { Image } from "./Image.tsx";

const meta: Meta<typeof Image> = {
  component: Image,
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
