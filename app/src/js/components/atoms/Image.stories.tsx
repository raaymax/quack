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
    data: {
      fileName: "file.txt",
      id: "file-id",
      url: "https://picsum.photos/200",
      size: 13000,
    },
  },
};
export const Wide: Story = {
  args: {
    data: {
      fileName: "file.txt",
      id: "file-id",
      url: "https://picsum.photos/1200/100",
      size: 13000,
    },
  },
};
export const Narrow: Story = {
  args: {
    data: {
      fileName: "file.txt",
      id: "file-id",
      url: "https://picsum.photos/100/1200",
      size: 13000,
    },
  },
};
