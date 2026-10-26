import styled from "styled-components";
import { filesize } from "filesize";
import { FileTypeIcon, getFileTypeLabel } from "./FileTypeIcon";
import { Icon } from "./Icon";
import { ClassNames, cn } from "../../utils";

const FileContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 280px;
  max-width: 100%;
  padding: 8px 8px 8px 10px;
  border: 1px solid ${(props) => props.theme.Strokes};
  border-radius: 10px;
  background-color: ${(props) => props.theme.Input.Background};
  transition: border-color 0.15s ease;

  &.clickable {
    cursor: pointer;
  }

  &.clickable:hover {
    border-color: ${(props) => props.theme.Labels};
  }

  .icon-box {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background-color: ${(props) => props.theme.Channel.Background};
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
    font-size: 11px;
    color: ${(props) => props.theme.Labels};
  }

  button {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 6px;
    cursor: pointer;
    color: ${(props) => props.theme.Labels};
    background-color: transparent;

    &:hover {
      color: ${(props) => props.theme.Text};
      background-color: ${(props) => props.theme.Channel.Background};
    }
  }
`;

type FileProps = {
  className?: ClassNames;
  fileName: string;
  contentType: string;
  size?: number;
  openUrl?: string;
  downloadUrl?: string;
};

export const File = ({
  className,
  fileName,
  contentType,
  size,
  openUrl,
  downloadUrl,
}: FileProps) => (
  <FileContainer
    className={cn("file", { clickable: !!openUrl }, className)}
    onClick={() => openUrl && window.open(openUrl)}
  >
    <div className="icon-box">
      <FileTypeIcon contentType={contentType} size={18} />
    </div>
    <div className="meta">
      <span className="file-name" title={fileName}>{fileName}</span>
      <span className="file-sub">
        {[
          getFileTypeLabel(fileName, contentType),
          size ? filesize(size) : null,
        ].filter(Boolean).join(" · ")}
      </span>
    </div>
    {downloadUrl && (
      <button
        type="button"
        title="Download"
        onClick={(e) => {
          e.stopPropagation();
          window.open(downloadUrl);
        }}
      >
        <Icon icon="download" size={14} />
      </button>
    )}
  </FileContainer>
);
