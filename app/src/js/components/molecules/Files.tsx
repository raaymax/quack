import styled from "styled-components";
import { File } from "../atoms/File";
import { Image } from "../atoms/Image";

const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];
const RAW_IMAGE_TYPES = ["image/gif", "image/webp"];

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 100%;

  .file-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }

  .file-list.others {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
`;

type FileData = {
  id?: string;
  clientId?: string;
  fileName: string;
  contentType: string;
  size?: number;
  url?: string;
};

type FilesProps = {
  list: FileData[];
};

const getImageSrc = (file: FileData, height: number) => {
  if (!file.url) return "";
  if (RAW_IMAGE_TYPES.includes(file.contentType)) return file.url;
  return `${file.url}?h=${height}`;
};

const getDownloadUrl = (file: FileData) =>
  file.url ? `${file.url}?download=true` : undefined;

export const Files = ({ list }: FilesProps) => {
  if (list.length === 0) return null;
  const images = list.filter((file) => IMAGE_TYPES.includes(file.contentType));
  const others = list.filter((file) => !IMAGE_TYPES.includes(file.contentType));
  const single = images.length === 1;

  return (
    <Container className="cmp-files">
      {images.length > 0 && (
        <div className="file-list images">
          {images.map((file) => (
            <Image
              key={file.id || file.clientId}
              variant={single ? "single" : "tile"}
              fileName={file.fileName}
              src={getImageSrc(file, single ? 560 : 320)}
              openUrl={file.url}
              downloadUrl={getDownloadUrl(file)}
              size={file.size}
            />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="file-list others">
          {others.map((file) => (
            <File
              key={file.id || file.clientId}
              fileName={file.fileName}
              contentType={file.contentType}
              size={file.size}
              openUrl={file.url}
              downloadUrl={getDownloadUrl(file)}
            />
          ))}
        </div>
      )}
    </Container>
  );
};
