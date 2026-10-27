import type { Meta, StoryObj } from "@storybook/react";

import { File } from "./File.tsx";

const meta: Meta<typeof File> = {
  component: File,
  title: "Atoms/File",
  argTypes: {
    fileName: {
      control: "text",
      description: "Display name of the file",
    },
    contentType: {
      control: "text",
      description: "MIME type of the file",
    },
    size: {
      control: "number",
      description: "File size in bytes",
    },
    openUrl: {
      control: "text",
      description: "URL to open on click",
    },
    downloadUrl: {
      control: "text",
      description: "URL used by the download button",
    },
  },
};

export default meta;
type Story = StoryObj<typeof File>;

export const Primary: Story = {
  args: {
    fileName: "file.txt",
    contentType: "text/plain",
    size: 1200,
  },
};

export const WithDownload: Story = {
  args: {
    fileName: "document.pdf",
    contentType: "application/pdf",
    size: 2048000,
    openUrl: "https://example.com/document.pdf",
    downloadUrl: "https://example.com/document.pdf",
  },
};

export const LongName: Story = {
  args: {
    fileName: "quarterly-financial-report-final-version-2-reviewed.xlsx",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 512000,
    downloadUrl: "https://example.com/report.xlsx",
  },
};
