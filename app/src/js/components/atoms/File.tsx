import styled from "styled-components";

const FileContainer = styled.div`
  cursor: pointer;
  flex: 100%;
  width: 100%;
  height: 30px;
  padding: 0;
  margin: 3px 0px;
  display: flex;
  flex-direction: row;
  border: 1px solid var(--saf-0);
  .type {
    line-height: 30px;
    width: 30px;
    text-align: center;
    vertical-align: middle;
  }

  .name {
    padding: 0 10px;
    line-height: 30px;
    vertical-align: middle;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &:hover {
    background-color: var(--primary_active_mask);
  }
  &.image {
    height: auto;
    width: 100%;
    flex: 0;

    img.raw-image {
      max-width: 400px;
      max-height: 400px;
    }
  }
`;

type FileProps = {
  fileName: string;
  contentType: string;
  downloadUrl?: string;
};

export const File = ({ fileName, contentType, downloadUrl }: FileProps) => (
  <FileContainer
    onClick={() => downloadUrl && window.open(downloadUrl)}
    style={{ cursor: downloadUrl ? "pointer" : "default" }}
  >
    <div className="type">
      <i className="fa-solid fa-file" />
    </div>
    <div className="name">
      {fileName} [{contentType}]
    </div>
  </FileContainer>
);
