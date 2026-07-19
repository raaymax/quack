import styled from "styled-components";
import { filesize } from "filesize";
import { FileTypeIcon, getFileCategory } from "../atoms/FileTypeIcon";
import { Icon } from "../atoms/Icon";
import { ClassNames, cn, formatDate } from "../../utils";
import type { FileItem } from "./FileListItem.tsx";

const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid ${(props) => props.theme.Strokes};
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background-color: ${(props) => props.theme.Input.Background};
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${(props) => props.theme.Labels};
  }

  .preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120px;
    background-color: ${(props) => props.theme.Channel.Background};
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;

    .file-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 13px;
      font-weight: 500;
      color: ${(props) => props.theme.Text};
    }

    .file-sub {
      font-size: 11px;
      color: ${(props) => props.theme.Labels};
    }
  }

  .actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
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
      cursor: pointer;
      color: #fff;
      background-color: rgba(0, 0, 0, 0.55);

      &:hover {
        background-color: rgba(0, 0, 0, 0.75);
      }
    }
  }

  &:hover .actions {
    opacity: 1;
  }
`;

type FileGridItemProps = {
  file: FileItem;
  className?: ClassNames;
  onDownload?: (file: FileItem) => void;
  onRemove?: (file: FileItem) => void;
};

export const FileGridItem = ({
  file,
  className,
  onDownload,
  onRemove,
}: FileGridItemProps) => {
  const isImage = getFileCategory(file.contentType) === "image";
  const thumbUrl = isImage && file.url ? `${file.url}?h=240` : undefined;

  const open = () => {
    if (file.url) window.open(file.url);
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Card className={cn("file-grid-item", className)} onClick={open}>
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

      <div className="preview">
        {thumbUrl
          ? <img src={thumbUrl} alt={file.fileName} />
          : <FileTypeIcon contentType={file.contentType} size={48} />}
      </div>

      <div className="meta">
        <span className="file-name" title={file.fileName}>
          {file.fileName}
        </span>
        <span className="file-sub">
          {(file.size ? filesize(file.size) : "—") + " · " +
            formatDate(file.createdAt)}
        </span>
      </div>
    </Card>
  );
};
