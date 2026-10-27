import styled from "styled-components";
import { filesize } from "filesize";
import { FileTypeIcon } from "../atoms/FileTypeIcon";
import { ClassNames, cn, formatDate } from "../../utils";
import {
  FileActions,
  type FileItem,
  getThumbUrl,
  openFile,
} from "./FileListItem.tsx";

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

      &.danger {
        background-color: #af0000;

        &:hover {
          background-color: #d32f2f;
        }
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
  onAttach?: (file: FileItem) => void;
};

export const FileGridItem = ({
  file,
  className,
  onDownload,
  onRemove,
  onAttach,
}: FileGridItemProps) => {
  const thumbUrl = getThumbUrl(file, 240);

  return (
    <Card
      className={cn("file-grid-item", className)}
      onClick={() => openFile(file)}
    >
      <FileActions
        file={file}
        onDownload={onDownload}
        onRemove={onRemove}
        onAttach={onAttach}
      />

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
          {(file.draft ? "Draft · " : "") +
            (file.size == null ? "—" : filesize(file.size)) + " · " +
            formatDate(file.createdAt)}
        </span>
      </div>
    </Card>
  );
};
