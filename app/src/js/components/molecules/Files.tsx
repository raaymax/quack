import styled from "styled-components";
import { File } from "../atoms/File";
import { Image } from "../atoms/Image";
import { observer } from "mobx-react-lite";
import { client } from "../../core";

const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];
const RAW_IMAGE_TYPES = ["image/gif", "image/webp"];

const Container = styled.div`
  max-width: calc(100% - 96px);
  .file-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
    .fli {
      min-width: 100px;
      max-width: 400px;
    }
  }
`;

type FileData = {
  id?: string;
  clientId?: string;
  fileName: string;
  contentType: string;
  size?: number;
};

type FilesProps = {
  list: FileData[];
};

const getImageSrc = (file: FileData, raw: boolean): string => {
  if (file.id) {
    return raw
      ? client.api.getUrl(file.id)
      : client.api.getThumbnail(file.id, { h: 240 });
  }
  return "";
};

export const Files = observer(({ list }: FilesProps) =>
  list.length > 0
    ? (
      <Container className="cmp-files">
        <div className="file-list">
          {list
            .filter((file) => IMAGE_TYPES.includes(file.contentType))
            .map((file) => {
              const raw = RAW_IMAGE_TYPES.includes(file.contentType);
              return (
                <div className="fli" key={file.id || file.clientId}>
                  <Image
                    raw={raw}
                    fileName={file.fileName}
                    src={getImageSrc(file, raw)}
                    downloadUrl={file.id ? client.api.getUrl(file.id) : undefined}
                    size={file.size}
                  />
                </div>
              );
            })}
        </div>
        <div className="file-list">
          {list
            .filter((file) => !IMAGE_TYPES.includes(file.contentType))
            .map((file) => (
              <File
                key={file.id || file.clientId}
                fileName={file.fileName}
                contentType={file.contentType}
                downloadUrl={file.id ? client.api.getDownloadUrl(file.id) : undefined}
              />
            ))}
        </div>
      </Container>
    )
    : null
);
