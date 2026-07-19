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
  resolution?: { width: number; height: number } | null;
  messageId?: string | null;
  removable?: boolean;
  uploader: FileUploader;
};

const MOBILE = "@media (max-width: 540px)";

const Row = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 160px 120px 90px 72px;
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
};

export const FileListItem = ({
  file,
  className,
  onDownload,
  onRemove,
}: FileListItemProps) => {
  const isImage = getFileCategory(file.contentType) === "image";
  const thumbUrl = isImage && file.url ? `${file.url}?h=80` : undefined;

  const open = () => {
    if (file.url) window.open(file.url);
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Row className={cn("file-list-item", className)} onClick={open}>
      <div className="thumb">
        {thumbUrl
          ? <img src={thumbUrl} alt={file.fileName} />
          : <FileTypeIcon contentType={file.contentType} size={28} />}
      </div>

      <div className="name">
        <span className="file-name">{file.fileName}</span>
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

      <div className="actions">
        <button
          type="button"
          title="Download"
          onClick={(e) => {
            stop(e);
            onDownload ? onDownload(file) : open();
          }}
        >
          <Icon icon="download" size={14} />
        </button>
        {onRemove && file.removable !== false && (
          <button
            type="button"
            title="Remove"
            onClick={(e) => {
              stop(e);
              onRemove(file);
            }}
          >
            <Icon icon="delete" size={14} />
          </button>
        )}
      </div>
    </Row>
  );
};
