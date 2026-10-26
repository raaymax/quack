import { useEffect, useMemo } from "react";
import { filesize } from "filesize";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { ClassNames, cn } from "../../utils";
import { FileModel, FilesModel } from "../../core/models/files";
import {
  FileTypeIcon,
  getFileCategory,
  getFileTypeLabel,
} from "../atoms/FileTypeIcon";
import { Icon } from "../atoms/Icon";

const Container = styled.div`
  .attachment-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 12px;
  }
`;

const AttachmentCard = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 240px;
  max-width: 100%;
  height: 56px;
  padding: 8px 6px 8px 8px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.Strokes};
  border-radius: 10px;
  background-color: ${(props) => props.theme.Input.Background};

  &.error {
    border-color: #e5484d;
  }

  .preview {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    overflow: hidden;
    border-radius: 8px;
    background-color: ${(props) => props.theme.Channel.Background};

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .icon {
      margin: 0;
    }
  }

  &.uploading .preview img {
    opacity: 0.6;
  }

  .meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .file-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    font-weight: 500;
    color: ${(props) => props.theme.Text};
  }

  .file-sub {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11px;
    color: ${(props) => props.theme.Labels};
  }

  &.error .file-sub {
    color: #e5484d;
  }

  .remove {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    cursor: pointer;
    color: ${(props) => props.theme.Labels};
    background-color: transparent;

    .icon {
      margin: 0;
    }

    &:hover {
      color: ${(props) => props.theme.Text};
      background-color: ${(props) => props.theme.Channel.Background};
    }
  }

  .progress-track {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    background-color: ${(props) => props.theme.Strokes};
  }

  .progress-bar {
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.15s ease;
  }
`;

const useLocalPreview = (model: FileModel) => {
  const isImage = getFileCategory(model.contentType) === "image";
  const file = model.file;
  const url = useMemo(
    () => (isImage && file instanceof Blob ? URL.createObjectURL(file) : null),
    [isImage, file],
  );
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
};

type AttachmentProps = {
  model: FileModel;
  onDelete: () => void;
};

export const Attachment = observer(({
  model,
  onDelete,
}: AttachmentProps) => {
  const preview = useLocalPreview(model);
  const done = model.status === "ok";
  const failed = model.status === "error";
  const uploading = !done && !failed;

  const sub = failed
    ? model.error || "Upload failed"
    : uploading
    ? `Uploading ${Math.round(model.progress)}% · ${filesize(model.fileSize)}`
    : `${getFileTypeLabel(model.fileName, model.contentType)} · ${
      filesize(model.fileSize)
    }`;

  return (
    <AttachmentCard
      className={cn("attachment", { uploading, error: failed })}
    >
      <div className="preview">
        {preview
          ? <img src={preview} alt={model.fileName} />
          : <FileTypeIcon contentType={model.contentType} size={18} />}
      </div>
      <div className="meta">
        <span className="file-name" title={model.fileName}>
          {model.fileName}
        </span>
        <span className="file-sub" title={sub}>{sub}</span>
      </div>
      <button
        type="button"
        className="remove"
        title={uploading ? "Cancel upload" : "Remove"}
        onClick={onDelete}
      >
        <Icon icon="xmark" size={14} />
      </button>
      {uploading && (
        <div className="progress-track">
          <div
            className="progress-bar"
            style={{ width: `${model.progress}%` }}
          />
        </div>
      )}
    </AttachmentCard>
  );
});

export const Attachments = observer(
  ({ className, model }: { className?: ClassNames; model: FilesModel }) => {
    const files = model.getAll();
    const hasFiles = files.length > 0;

    return (
      <Container className={cn(className)}>
        {hasFiles &&
          (
            <div className="attachment-list">
              {files.map((file) => (
                <Attachment
                  key={file.clientId}
                  model={file}
                  onDelete={() => {
                    model.abort(file.clientId);
                  }}
                />
              ))}
            </div>
          )}
      </Container>
    );
  },
);
