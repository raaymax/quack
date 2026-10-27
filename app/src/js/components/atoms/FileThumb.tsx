import { useState } from "react";
import styled from "styled-components";
import { FileTypeIcon } from "./FileTypeIcon";
import { ClassNames, cn } from "../../utils";

const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: inherit;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &.loaded img {
    opacity: 1;
  }

  &.loaded .file-type-icon {
    visibility: hidden;
  }
`;

type FileThumbProps = {
  src?: string;
  alt: string;
  contentType: string;
  iconSize: number;
  className?: ClassNames;
};

export const FileThumb = (
  { src, alt, contentType, iconSize, className }: FileThumbProps,
) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <Container className={cn("file-thumb", { loaded }, className)}>
      <FileTypeIcon contentType={contentType} size={iconSize} />
      {src && !failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </Container>
  );
};
