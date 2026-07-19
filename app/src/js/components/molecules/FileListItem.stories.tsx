import type { Meta, StoryObj } from "@storybook/react";

import { FileListItem } from "./FileListItem.tsx";
import { mockFiles } from "./mockFiles.ts";

const meta: Meta<typeof FileListItem> = {
  component: FileListItem,
  title: "Molecules/FileListItem",
  parameters: { layout: "padded" },
  argTypes: {
    onDownload: { action: "download" },
    onRemove: { action: "remove" },
  },
};

export default meta;
type Story = StoryObj<typeof FileListItem>;

export const Document: Story = {
  args: { file: mockFiles[0], onDownload: () => {} },
};

export const Image: Story = {
  args: { file: mockFiles[1], onDownload: () => {} },
};

export const WithRemove: Story = {
  args: { file: mockFiles[4], onDownload: () => {}, onRemove: () => {} },
};

export const List: Story = {
  render: (args) => (
    <div>
      {mockFiles.map((file) => (
        <FileListItem
          key={file.id}
          {...args}
          file={file}
          onDownload={() => {}}
          onRemove={() => {}}
        />
      ))}
    </div>
  ),
};
