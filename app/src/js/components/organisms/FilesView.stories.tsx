import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useRef, useState } from "react";

import { FilesView } from "./FilesView.tsx";
import {
  type ChannelViewKey,
  NavChannelTree,
} from "../molecules/NavChannelTree.tsx";
import { makeOlderFiles, mockFiles } from "../molecules/mockFiles.ts";
import type { FileItem } from "../molecules/FileListItem.tsx";

const meta: Meta<typeof FilesView> = {
  component: FilesView,
  title: "Organisms/FilesView",
  parameters: { layout: "fullscreen" },
  args: { channelName: "general" },
  argTypes: {
    onDownload: { action: "download" },
    onRemove: { action: "remove" },
  },
  render: (args) => (
    <div style={{ height: "100vh" }}>
      <FilesView {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof FilesView>;

const useMockFiles = (initial: FileItem[] = mockFiles) => {
  const [files, setFiles] = useState<FileItem[]>(initial);
  const onRemove = useCallback((file: FileItem) => {
    setFiles((current) => current.filter((f) => f.id !== file.id));
  }, []);
  return { files, onRemove };
};

export const ListView: Story = {
  render: (args) => {
    const { files, onRemove } = useMockFiles();
    return (
      <div style={{ height: "100vh" }}>
        <FilesView {...args} files={files} onRemove={onRemove} />
      </div>
    );
  },
};

export const GridView: Story = {
  render: (args) => {
    const { files, onRemove } = useMockFiles();
    return (
      <div style={{ height: "100vh" }}>
        <FilesView {...args} files={files} onRemove={onRemove} />
      </div>
    );
  },
  args: { defaultView: "grid" },
};

export const Loading: Story = {
  args: { files: [], loading: true },
};

export const Empty: Story = {
  args: { files: [], channelName: "design-team", channelType: "PRIVATE" },
};

export const LoadError: Story = {
  args: { files: [], error: true, onRetry: () => {} },
};

export const Mobile: Story = {
  render: (args) => {
    const { files, onRemove } = useMockFiles();
    return (
      <div style={{ height: "100vh" }}>
        <FilesView {...args} files={files} onRemove={onRemove} />
      </div>
    );
  },
  args: { onMenu: () => {} },
  parameters: { viewport: { defaultViewport: "mobile" } },
};

export const MobileGrid: Story = {
  render: (args) => {
    const { files, onRemove } = useMockFiles();
    return (
      <div style={{ height: "100vh" }}>
        <FilesView {...args} files={files} onRemove={onRemove} />
      </div>
    );
  },
  args: { defaultView: "grid", onMenu: () => {} },
  parameters: { viewport: { defaultViewport: "mobile" } },
};

const MAX_FILES = 48;

const useFakePager = () => {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const seed = useRef(0);

  const onLoadOlder = useCallback(() => {
    setLoadingOlder(true);
    setTimeout(() => {
      setFiles((current) => {
        const oldest = current.reduce(
          (min, f) => (f.createdAt < min ? f.createdAt : min),
          current[0]?.createdAt ?? new Date().toISOString(),
        );
        const older = makeOlderFiles(8, oldest, seed.current);
        seed.current += 8;
        return [...older, ...current];
      });
      setLoadingOlder(false);
    }, 700);
  }, []);

  const onRemove = useCallback((file: FileItem) => {
    setFiles((current) => current.filter((f) => f.id !== file.id));
  }, []);

  return {
    files,
    loadingOlder,
    onLoadOlder,
    onRemove,
    hasMoreOlder: files.length < MAX_FILES,
  };
};

export const InfiniteScroll: Story = {
  render: (args) => {
    const pager = useFakePager();
    return (
      <div style={{ height: "100vh" }}>
        <FilesView
          {...args}
          files={pager.files}
          loadingOlder={pager.loadingOlder}
          hasMoreOlder={pager.hasMoreOlder}
          onLoadOlder={pager.onLoadOlder}
          onRemove={pager.onRemove}
        />
      </div>
    );
  },
};

export const InChannelContext: Story = {
  render: (args) => {
    const [activeView, setActiveView] = useState<ChannelViewKey>("files");
    const pager = useFakePager();
    return (
      <div style={{ height: "100vh", display: "flex" }}>
        <div
          style={{
            width: 260,
            flex: "0 0 260px",
            borderRight: "1px solid rgba(128,128,128,0.3)",
            paddingTop: 8,
          }}
        >
          <NavChannelTree
            channels={[
              { id: "c-general", name: "general", kind: "PUBLIC", unread: 3 },
              { id: "c-design", name: "design-team", kind: "PRIVATE" },
            ]}
            activeChannelId="c-general"
            activeView={activeView}
            onSelectView={(_id, view) => setActiveView(view)}
            onSelectChannel={() => setActiveView("messages")}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeView === "files"
            ? (
              <FilesView
                {...args}
                files={pager.files}
                loadingOlder={pager.loadingOlder}
                hasMoreOlder={pager.hasMoreOlder}
                onLoadOlder={pager.onLoadOlder}
                onRemove={pager.onRemove}
                onClose={() => setActiveView("messages")}
              />
            )
            : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  opacity: 0.5,
                }}
              >
                (Messages view)
              </div>
            )}
        </div>
      </div>
    );
  },
};
