import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useRef, useState } from "react";

import { FilesTimeline } from "./FilesTimeline.tsx";
import { makeOlderFiles, mockFiles } from "./mockFiles.ts";
import type { FileItem } from "./FileListItem.tsx";

const meta: Meta<typeof FilesTimeline> = {
  component: FilesTimeline,
  title: "Molecules/FilesTimeline",
  parameters: { layout: "fullscreen" },
  argTypes: {
    onDownload: { action: "download" },
    onRemove: { action: "remove" },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", display: "flex" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FilesTimeline>;

const asc = [...mockFiles].sort((a, b) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
);

export const ListTimeline: Story = {
  args: { files: asc, view: "list" },
};

export const GridTimeline: Story = {
  args: { files: asc, view: "grid" },
};

export const NoDateSeparators: Story = {
  args: { files: asc, view: "list", showDateSeparators: false },
};

export const InfiniteOlder: Story = {
  render: (args) => {
    const [files, setFiles] = useState<FileItem[]>(asc);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const seed = useRef(0);

    const onLoadOlder = useCallback(() => {
      setLoadingOlder(true);
      setTimeout(() => {
        setFiles((current) => {
          const older = makeOlderFiles(8, current[0].createdAt, seed.current);
          seed.current += 8;
          return [...older, ...current];
        });
        setLoadingOlder(false);
      }, 700);
    }, []);

    return (
      <FilesTimeline
        {...args}
        files={files}
        loadingOlder={loadingOlder}
        hasMoreOlder={files.length < 40}
        onLoadOlder={onLoadOlder}
      />
    );
  },
  args: { view: "list" },
};
