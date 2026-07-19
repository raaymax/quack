import type { Meta, StoryObj } from "@storybook/react";

import { FileGridItem } from "./FileGridItem.tsx";
import { mockFiles } from "./mockFiles.ts";

const meta: Meta<typeof FileGridItem> = {
  component: FileGridItem,
  title: "Molecules/FileGridItem",
  parameters: { layout: "padded" },
  argTypes: {
    onDownload: { action: "download" },
    onRemove: { action: "remove" },
  },
};

export default meta;
type Story = StoryObj<typeof FileGridItem>;

export const Image: Story = {
  render: (args) => (
    <div style={{ width: 200 }}>
      <FileGridItem {...args} />
    </div>
  ),
  args: { file: mockFiles[1], onDownload: () => {} },
};

export const Document: Story = {
  render: (args) => (
    <div style={{ width: 200 }}>
      <FileGridItem {...args} />
    </div>
  ),
  args: { file: mockFiles[0], onDownload: () => {}, onRemove: () => {} },
};

export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 16,
      }}
    >
      {mockFiles.map((file) => (
        <FileGridItem
          key={file.id}
          file={file}
          onDownload={() => {}}
          onRemove={() => {}}
        />
      ))}
    </div>
  ),
};
