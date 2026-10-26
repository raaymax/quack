import { useState } from "react";
import styled from "styled-components";
import { filesize } from "filesize";
import { FileTypeIcon, getFileCategory } from "../atoms/FileTypeIcon";
import { ProfilePic } from "../atoms/ProfilePic";
import { Icon } from "../atoms/Icon";
import { ClassNames, cn, formatDate } from "../../utils";

export type FileUploader = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type FileItem = {
  id: string;
  fileName: string;
  contentType: string;
  size: number | null;
  createdAt: string;
  url?: string;
  removable?: boolean;
  draft?: boolean;
  uploader: FileUploader;
};

export const openFile = (file: FileItem) => {
  if (file.url) window.open(file.url);
};

export const getThumbUrl = (file: FileItem, height: number) => {
  if (getFileCategory(file.contentType) !== "image" || !file.url) {
    return undefined;
  }
  if (file.url.startsWith("data:") || file.url.startsWith("blob:")) {
    return file.url;
  }
  return `${file.url}?h=${height}`;
};

type FileActionsProps = {
  file: FileItem;
  onDownload?: (file: FileItem) => void;
  onRemove?: (file: FileItem) => void;
  onAttach?: (file: FileItem) => void;
};

export const FileActions = (
  { file, onDownload, onRemove, onAttach }: FileActionsProps,
) => {
  const [confirming, setConfirming] = useState(false);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  if (confirming) {
    return (
      <div className="actions" onMouseLeave={() => setConfirming(false)}>
        <button
          type="button"
          title="Confirm delete"
          className="danger"
          onClick={(e) => {
            stop(e);
            setConfirming(false);
            onRemove?.(file);
          }}
        >
          <Icon icon="check" size={14} />
        </button>
        <button
          type="button"
          title="Cancel"
          onClick={(e) => {
            stop(e);
            setConfirming(false);
          }}
        >
          <Icon icon="circle-xmark" size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="actions">
      {onAttach && file.draft && (
        <button
          type="button"
          title="Attach to channel"
          onClick={(e) => {
            stop(e);
            onAttach(file);
          }}
        >
          <Icon icon="send" size={14} />
        </button>
      )}
      <button
        type="button"
        title="Download"
        onClick={(e) => {
          stop(e);
          onDownload ? onDownload(file) : openFile(file);
        }}
      >
        <Icon icon="download" size={14} />
      </button>
      {onRemove && file.removable !== false && (
        <button
          type="button"
          title="Delete"
          onClick={(e) => {
            stop(e);
            setConfirming(true);
          }}
        >
          <Icon icon="delete" size={14} />
        </button>
      )}
    </div>
  );
};

const MOBILE = "@media (max-width: 540px)";

const Row = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 160px 120px 90px 104px;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 12px;
  border-bottom: 1px solid ${(props) => props.theme.Strokes};
  cursor: pointer;
  color: ${(props) => props.theme.Text};

  &:hover {
    background-color: ${(props) => props.theme.Channel.Background};
  }

  .thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;

    img {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      object-fit: cover;
    }
  }

  .name {
    min-width: 0;
    display: flex;
    flex-direction: column;

    .file-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 14px;
    }

    .draft-tag {
      align-self: flex-start;
      padding: 0 6px;
      border-radius: 4px;
      font-size: 11px;
      color: ${(props) => props.theme.Labels};
      border: 1px dashed ${(props) => props.theme.Labels};
    }

    .file-type {
      font-size: 11px;
      color: ${(props) => props.theme.Labels};
    }

    .meta-inline {
      display: none;
      font-size: 12px;
      color: ${(props) => props.theme.Labels};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .uploader {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: ${(props) => props.theme.Labels};
    font-size: 13px;

    .uploader-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .date, .size {
    font-size: 13px;
    color: ${(props) => props.theme.Labels};
  }

  .size {
    text-align: right;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.12s ease;

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      color: ${(props) => props.theme.Labels};

      &:hover {
        color: ${(props) => props.theme.Text};
        background-color: ${(props) => props.theme.Channel.Hover};
      }

      &.danger {
        color: #fff;
        background-color: #af0000;

        &:hover {
          color: #fff;
          background-color: #d32f2f;
        }
      }
    }
  }

  &:hover .actions {
    opacity: 1;
  }

  ${MOBILE} {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    height: auto;
    min-height: 56px;
    padding: 8px 12px;

    .uploader,
    .date,
    .size,
    .name .file-type {
      display: none;
    }

    .name .meta-inline {
      display: block;
    }

    .actions {
      opacity: 1;
    }
  }
`;

type FileListItemProps = {
  file: FileItem;
  className?: ClassNames;
  onDownload?: (file: FileItem) => void;
  onRemove?: (file: FileItem) => void;
  onAttach?: (file: FileItem) => void;
};

export const FileListItem = ({
  file,
  className,
  onDownload,
  onRemove,
  onAttach,
}: FileListItemProps) => {
  const thumbUrl = getThumbUrl(file, 80);

  return (
    <Row
      className={cn("file-list-item", className)}
      onClick={() => openFile(file)}
    >
      <div className="thumb">
        {thumbUrl
          ? <img src={thumbUrl} alt={file.fileName} />
          : <FileTypeIcon contentType={file.contentType} size={28} />}
      </div>

      <div className="name">
        <span className="file-name">{file.fileName}</span>
        {file.draft && <span className="draft-tag">Draft</span>}
        <span className="file-type">{file.contentType}</span>
        <span className="meta-inline">
          {file.uploader.name} ·{" "}
          {file.size == null ? "—" : filesize(file.size)} ·{" "}
          {formatDate(file.createdAt)}
        </span>
      </div>

      <div className="uploader">
        <ProfilePic type="tiny" avatarUrl={file.uploader.avatarUrl} />
        <span className="uploader-name">{file.uploader.name}</span>
      </div>

      <div className="date">{formatDate(file.createdAt)}</div>

      <div className="size">
        {file.size == null ? "—" : filesize(file.size)}
      </div>

      <FileActions
        file={file}
        onDownload={onDownload}
        onRemove={onRemove}
        onAttach={onAttach}
      />
    </Row>
  );
};
