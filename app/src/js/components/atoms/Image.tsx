import styled from "styled-components";
import { ClassNames, cn } from "../../utils";
import { filesize } from "filesize";

// deno-fmt-ignore
const ImageContainer = styled.div`
  cursor: pointer;
  min-width: 100px;
  max-width: 400px;

  img {
    width: auto;
    height: 240px;
    min-width: 100px;
    max-width: 100%;
    object-fit: cover;
    margin: 0 auto;
    border-radius: 8px;
  }

  img.raw-image {
    max-width: 400px;
    max-height: 400px;
  }
  &:hover {
    img {
      transform: scale(1.1);
    }
  }
  .caption {
    color: ${(props) => props.theme.Labels};
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px; /* 166.667% */
`;

type ImageProps = {
  raw?: boolean;
  className?: ClassNames;
  fileName: string;
  src: string;
  downloadUrl?: string;
  size?: number;
};

export const Image = ({
  className,
  raw,
  fileName,
  src,
  downloadUrl,
  size,
}: ImageProps) => {
  const formattedSize = filesize(size ?? 0);

  return (
    <ImageContainer
      className={cn("file", "image", className)}
      onClick={() => downloadUrl && window.open(downloadUrl)}
      style={{ cursor: downloadUrl ? "pointer" : "default" }}
    >
      <img
        className={raw ? "raw-image" : undefined}
        src={src}
        alt={fileName}
      />
      {(fileName || size) && (
        <div className="caption">{[fileName, formattedSize].join(", ")}</div>
      )}
    </ImageContainer>
  );
};
