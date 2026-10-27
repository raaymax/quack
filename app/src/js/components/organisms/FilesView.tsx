import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";
import type { ChannelType } from "../../types";
import { FilesToolbar, type ViewMode } from "../molecules/FilesToolbar";
import { FilesTimeline } from "../molecules/FilesTimeline";
import { type FileItem } from "../molecules/FileListItem";
import { Loader } from "../atoms/Loader";
import { Icon } from "../atoms/Icon";
import { ClassNames, cn } from "../../utils";

const Container = styled.div`
  position: relative;
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

    .retry {
      border: 1px solid ${(props) => props.theme.Strokes};
      border-radius: 8px;
      padding: 6px 16px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: ${(props) => props.theme.Text};

      &:hover {
        background-color: ${(props) => props.theme.Channel.Background};
      }
    }
  }

  .files-loading {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
  }

  .files-error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    font-size: 13px;
    color: #fff;
    background-color: #af0000;

    span {
      flex: 1;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      color: #fff;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .files-uploads {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 16px;
    max-height: 180px;
    overflow-y: auto;
    border-bottom: 1px solid ${(props) => props.theme.Strokes};

    .files-uploads-head {
      font-size: 12px;
      font-weight: 600;
      color: ${(props) => props.theme.Labels};
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .upload-row {
      display: grid;
      grid-template-columns: 16px minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: ${(props) => props.theme.Labels};

      .upload-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: ${(props) => props.theme.Text};
      }

      .upload-pct {
        font-variant-numeric: tabular-nums;
      }

      .upload-status {
        padding: 1px 8px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        color: #fff;
        background-color: #af0000;
      }

      .upload-actions {
        display: flex;
        gap: 2px;

        button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          color: ${(props) => props.theme.Labels};

          &:hover {
            color: ${(props) => props.theme.Text};
            background-color: ${(props) => props.theme.Channel.Hover};
          }
        }
      }

      .upload-bar {
        grid-column: 1 / -1;
        height: 4px;
        border-radius: 2px;
        overflow: hidden;
        background-color: ${(props) => props.theme.Strokes};

        .upload-bar-fill {
          height: 100%;
          background-color: ${(props) => props.theme.PrimaryButton.Background};
          transition: width 0.15s ease;
        }
      }

      &.error .upload-bar-fill {
        background-color: #af0000;
      }
    }
  }

  &.dragging {
    outline: 2px dashed ${(props) => props.theme.Labels};
    outline-offset: -6px;
  }

  .files-drop-hint {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    pointer-events: none;
    background-color: ${(props) => props.theme.Chatbox.Background};
    opacity: 0.92;
    color: ${(props) => props.theme.Text};
    font-size: 15px;
    z-index: 2;
  }
`;

type FilesViewProps = {
  files: FileItem[];
  channelName: string;
  channelType?: ChannelType;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  loadingOlder?: boolean;
  hasMoreOlder?: boolean;
  onLoadOlder?: () => void;
  defaultView?: ViewMode;
  className?: ClassNames;
  onUpload?: (files: FileList) => void;
  uploads?: {
    clientId: string;
    fileName: string;
    progress: number;
    error?: boolean;
  }[];
  onDismissUpload?: (clientId: string) => void;
  onRetryUpload?: (clientId: string) => void;
  actionError?: string | null;
  onClearActionError?: () => void;
  onDownload?: (file: FileItem) => void;
  onRemove?: (file: FileItem) => void;
  onAttach?: (file: FileItem) => void;
  onClose?: () => void;
  onMenu?: () => void;
};

export const FilesView = observer(({
  files,
  channelName,
  channelType = "PUBLIC",
  loading = false,
  error = false,
  onRetry,
  loadingOlder = false,
  hasMoreOlder = false,
  onLoadOlder,
  defaultView = "list",
  className,
  onUpload,
  uploads = [],
  onDismissUpload,
  onRetryUpload,
  actionError = null,
  onClearActionError,
  onDownload,
  onRemove,
  onAttach,
  onClose,
  onMenu,
}: FilesViewProps) => {
  const [view, setView] = useState<ViewMode>(defaultView);
  const [query, setQuery] = useState("");
  const [showDates, setShowDates] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const activeUploads = uploads.filter((u) => !u.error);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (onUpload && e.dataTransfer.files.length) {
      onUpload(e.dataTransfer.files);
    }
  };

  const q = query.trim().toLowerCase();

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

    if (error) {
      return (
        <div className="files-empty">
          <Icon className="files-empty-icon" icon="circle-xmark" size={40} />
          <div className="files-empty-title">Failed to load files</div>
          <div className="files-empty-sub">
            {onRetry
              ? <button type="button" className="retry" onClick={onRetry}>Try again</button>
              : "Please try again later."}
          </div>
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="files-empty">
          <Icon className="files-empty-icon" icon="files" size={48} />
          <div className="files-empty-title">No files yet</div>
          <div className="files-empty-sub">
            Files shared in this {channelType === "DIRECT"
              ? "conversation"
              : "channel"} will show up here.
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
        onAttach={onAttach}
      />
    );
  };

  return (
    <Container
      className={cn("cmp-files-view", { dragging }, className)}
      onDragEnter={onUpload
        ? (e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }
        : undefined}
      onDragOver={onUpload ? (e) => e.preventDefault() : undefined}
      onDragLeave={onUpload
        ? () => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }
        : undefined}
      onDrop={onUpload ? handleDrop : undefined}
    >
      {onUpload && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.length) onUpload(e.target.files);
            e.target.value = "";
          }}
        />
      )}
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
        onUploadClick={onUpload
          ? () => fileInputRef.current?.click()
          : undefined}
        uploading={uploads.length > 0}
        onClose={onClose}
        onMenu={onMenu}
      />
      {actionError && (
        <div className="files-error-banner">
          <Icon icon="circle-xmark" size={14} />
          <span>{actionError}</span>
          {onClearActionError && (
            <button type="button" title="Dismiss" onClick={onClearActionError}>
              <Icon icon="xmark" size={12} />
            </button>
          )}
        </div>
      )}
      {uploads.length > 0 && (
        <div className="files-uploads">
          {activeUploads.length > 0 && (
            <div className="files-uploads-head">
              Uploading {activeUploads.length}{" "}
              {activeUploads.length === 1 ? "file" : "files"}…
            </div>
          )}
          {uploads.map((u) => (
            <div
              key={u.clientId}
              className={cn("upload-row", { error: !!u.error })}
            >
              <Icon icon="file" size={14} />
              <span className="upload-name">{u.fileName}</span>
              {u.error
                ? <span className="upload-status">Failed</span>
                : (
                  <span className="upload-pct">
                    {Math.round(u.progress)}%
                  </span>
                )}
              <div className="upload-actions">
                {u.error && onRetryUpload && (
                  <button
                    type="button"
                    title="Retry"
                    onClick={() => onRetryUpload(u.clientId)}
                  >
                    <Icon icon="refresh" size={12} />
                  </button>
                )}
                {onDismissUpload && (
                  <button
                    type="button"
                    title={u.error ? "Dismiss" : "Cancel upload"}
                    onClick={() => onDismissUpload(u.clientId)}
                  >
                    <Icon icon="xmark" size={12} />
                  </button>
                )}
              </div>
              <div className="upload-bar">
                <div
                  className="upload-bar-fill"
                  style={{ width: `${u.error ? 100 : u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {renderContent()}
      {dragging && (
        <div className="files-drop-hint">
          <Icon icon="upload" size={40} />
          <div>Drop files to upload</div>
        </div>
      )}
    </Container>
  );
});
