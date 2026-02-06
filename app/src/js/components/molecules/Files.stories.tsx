import type { Meta, StoryObj } from "@storybook/react";

import { Files } from "./Files.tsx";

const meta: Meta<typeof Files> = {
  component: Files,
};

export default meta;
type Story = StoryObj<typeof Files>;

export const Empty: Story = {
  args: {
    list: [],
  },
};

export const SingleImage: Story = {
  args: {
    list: [
      {
        id: "img-1",
        clientId: "client-1",
        fileName: "photo.jpg",
        contentType: "image/jpeg",
        size: 1024000,
      },
    ],
  },
};

export const MultipleImages: Story = {
  args: {
    list: [
      {
        id: "img-1",
        clientId: "client-1",
        fileName: "photo1.jpg",
        contentType: "image/jpeg",
        size: 1024000,
      },
      {
        id: "img-2",
        clientId: "client-2",
        fileName: "photo2.png",
        contentType: "image/png",
        size: 2048000,
      },
      {
        id: "img-3",
        clientId: "client-3",
        fileName: "animation.gif",
        contentType: "image/gif",
        size: 512000,
      },
    ],
  },
};

export const SingleFile: Story = {
  args: {
    list: [
      {
        id: "file-1",
        clientId: "client-1",
        fileName: "document.pdf",
        contentType: "application/pdf",
        size: 2048000,
      },
    ],
  },
};

export const MultipleFiles: Story = {
  args: {
    list: [
      {
        id: "file-1",
        clientId: "client-1",
        fileName: "document.pdf",
        contentType: "application/pdf",
        size: 2048000,
      },
      {
        id: "file-2",
        clientId: "client-2",
        fileName: "spreadsheet.xlsx",
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 512000,
      },
      {
        id: "file-3",
        clientId: "client-3",
        fileName: "archive.zip",
        contentType: "application/zip",
        size: 10240000,
      },
    ],
  },
};

export const MixedContent: Story = {
  args: {
    list: [
      {
        id: "img-1",
        clientId: "client-1",
        fileName: "screenshot.png",
        contentType: "image/png",
        size: 512000,
      },
      {
        id: "img-2",
        clientId: "client-2",
        fileName: "photo.jpg",
        contentType: "image/jpeg",
        size: 1024000,
      },
      {
        id: "file-1",
        clientId: "client-3",
        fileName: "report.pdf",
        contentType: "application/pdf",
        size: 2048000,
      },
      {
        id: "file-2",
        clientId: "client-4",
        fileName: "data.json",
        contentType: "application/json",
        size: 4096,
      },
    ],
  },
};

export const PendingUpload: Story = {
  args: {
    list: [
      {
        clientId: "pending-1",
        fileName: "uploading.jpg",
        contentType: "image/jpeg",
        size: 1024000,
      },
    ],
  },
};
