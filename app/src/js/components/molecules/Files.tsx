import styled from "styled-components";
import { File } from "../atoms/File";
import { Image } from "../atoms/Image";
import {
  getDownloadUrl,
  getFileUrl,
  getThumbnailUrl,
} from "../hooks/fileUrl";

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

type ImageFileItemProps = {
  file: FileData;
  raw: boolean;
};

const ImageFileItem = ({ file, raw }: ImageFileItemProps) => {
  const fileUrl = getFileUrl(file.id);
  const thumbnailUrl = getThumbnailUrl(file.id, { h: 240 });
  const src = raw ? fileUrl : thumbnailUrl;

  return (
    <div className="fli">
      <Image
        raw={raw}
        fileName={file.fileName}
        src={src ?? ""}
        downloadUrl={fileUrl}
        size={file.size}
      />
    </div>
  );
};

type NonImageFileItemProps = {
  file: FileData;
};

const NonImageFileItem = ({ file }: NonImageFileItemProps) => {
  const downloadUrl = getDownloadUrl(file.id);

  return (
    <File
      fileName={file.fileName}
      contentType={file.contentType}
      downloadUrl={downloadUrl}
    />
  );
};

export const Files = ({ list }: FilesProps) =>
  list.length > 0
    ? (
      <Container className="cmp-files">
        <div className="file-list">
          {list
            .filter((file) => IMAGE_TYPES.includes(file.contentType))
            .map((file) => {
              const raw = RAW_IMAGE_TYPES.includes(file.contentType);
              return (
                <ImageFileItem
                  key={file.id || file.clientId}
                  file={file}
                  raw={raw}
                />
              );
            })}
        </div>
        <div className="file-list">
          {list
            .filter((file) => !IMAGE_TYPES.includes(file.contentType))
            .map((file) => (
              <NonImageFileItem key={file.id || file.clientId} file={file} />
            ))}
        </div>
      </Container>
    )
    : null;
