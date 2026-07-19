import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  type ChannelType,
  FilesToolbar,
  type ViewMode,
} from "../molecules/FilesToolbar";
import { FilesTimeline } from "../molecules/FilesTimeline";
import { type FileItem } from "../molecules/FileListItem";
import { Loader } from "../atoms/Loader";
import { Icon } from "../atoms/Icon";
import { ClassNames, cn } from "../../utils";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background-color: ${(props) => props.theme.Chatbox.Background};
  color: ${(props) => props.theme.Text};

  .files-empty {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 16px;
    color: ${(props) => props.theme.Labels};
    text-align: center;

    .files-empty-icon {
      opacity: 0.5;
    }

    .files-empty-title {
      font-size: 15px;
      font-weight: 500;
      color: ${(props) => props.theme.Text};
    }

    .files-empty-sub {
      font-size: 13px;
    }
  }

  .files-loading {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
  }
`;

type FilesViewProps = {
  files: FileItem[];
  channelName: string;
  channelType?: ChannelType;
  loading?: boolean;
  loadingOlder?: boolean;
  hasMoreOlder?: boolean;
  onLoadOlder?: () => void;
  defaultView?: ViewMode;
  className?: ClassNames;
  onDownload?: (file: FileItem) => void;
  onRemove?: (file: FileItem) => void;
  onClose?: () => void;
};

export const FilesView = ({
  files,
  channelName,
  channelType = "PUBLIC",
  loading = false,
  loadingOlder = false,
  hasMoreOlder = false,
  onLoadOlder,
  defaultView = "list",
  className,
  onDownload,
  onRemove,
  onClose,
}: FilesViewProps) => {
  const [view, setView] = useState<ViewMode>(defaultView);
  const [query, setQuery] = useState("");
  const [showDates, setShowDates] = useState(true);

  const q = query.trim().toLowerCase();

  // Oldest first, newest last — the message-timeline ordering.
  const visible = useMemo(() => {
    const filtered = q
      ? files.filter((f) => f.fileName.toLowerCase().includes(q))
      : files;
    return [...filtered].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [files, q]);

  const renderContent = () => {
    if (loading) {
      return <div className="files-loading"><Loader /></div>;
    }

    if (files.length === 0) {
      return (
        <div className="files-empty">
          <Icon className="files-empty-icon" icon="files" size={48} />
          <div className="files-empty-title">No files yet</div>
          <div className="files-empty-sub">
            Files shared in this channel will show up here.
          </div>
        </div>
      );
    }

    if (visible.length === 0) {
      return (
        <div className="files-empty">
          <Icon className="files-empty-icon" icon="search" size={40} />
          <div className="files-empty-title">No matching files</div>
          <div className="files-empty-sub">Try a different search term.</div>
        </div>
      );
    }

    return (
      <FilesTimeline
        files={visible}
        view={view}
        showDateSeparators={showDates}
        hasMoreOlder={hasMoreOlder && !q}
        loadingOlder={loadingOlder}
        onLoadOlder={onLoadOlder}
        onDownload={onDownload}
        onRemove={onRemove}
      />
    );
  };

  return (
    <Container className={cn("cmp-files-view", className)}>
      <FilesToolbar
        channelName={channelName}
        channelType={channelType}
        count={visible.length}
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
        showDates={showDates}
        onToggleDates={() => setShowDates((v) => !v)}
        onClose={onClose}
      />
      {renderContent()}
    </Container>
  );
};

export default FilesView;
