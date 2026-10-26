import type { Meta, StoryObj } from "@storybook/react";

import { FileTypeIcon } from "./FileTypeIcon.tsx";

const meta: Meta<typeof FileTypeIcon> = {
  component: FileTypeIcon,
  title: "Atoms/FileTypeIcon",
  argTypes: {
    contentType: { control: "text", description: "MIME type of the file" },
    size: { control: { type: "range", min: 12, max: 96, step: 4 } },
  },
};

export default meta;
type Story = StoryObj<typeof FileTypeIcon>;

export const Image: Story = { args: { contentType: "image/png", size: 32 } };
export const Pdf: Story = { args: { contentType: "application/pdf", size: 32 } };
export const Video: Story = { args: { contentType: "video/mp4", size: 32 } };
export const Archive: Story = {
  args: { contentType: "application/zip", size: 32 },
};
export const Unknown: Story = {
  args: { contentType: "application/octet-stream", size: 32 },
};

export const Gallery: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {[
        "image/png",
        "video/mp4",
        "audio/mpeg",
        "application/pdf",
        "application/zip",
        "application/json",
        "application/msword",
        "application/vnd.ms-excel",
        "application/vnd.ms-powerpoint",
        "text/plain",
        "application/octet-stream",
      ].map((contentType) => (
        <div
          key={contentType}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            width: 120,
            fontSize: 11,
          }}
        >
          <FileTypeIcon contentType={contentType} size={40} />
          <span>{contentType}</span>
        </div>
      ))}
    </div>
  ),
};
