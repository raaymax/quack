import type { Meta, StoryObj } from "@storybook/react";

import { File } from "./File.tsx";

const meta: Meta<typeof File> = {
  component: File,
};

export default meta;
type Story = StoryObj<typeof File>;

export const Primary: Story = {
  args: {
    fileName: "file.txt",
    contentType: "text/plain",
  },
};

export const WithDownload: Story = {
  args: {
    fileName: "document.pdf",
    contentType: "application/pdf",
    downloadUrl: "https://example.com/document.pdf",
  },
};
