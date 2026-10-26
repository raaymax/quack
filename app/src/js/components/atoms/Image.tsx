import styled from "styled-components";
import { filesize } from "filesize";
import { Icon } from "./Icon";
import { ClassNames, cn } from "../../utils";

const ImageContainer = styled.div`
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid ${(props) => props.theme.Strokes};
  background-color: ${(props) => props.theme.Channel.Background};

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.single {
    max-width: min(360px, 100%);
    img {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 280px;
      min-width: 80px;
      min-height: 80px;
    }
  }

  &.tile {
    width: 160px;
    height: 160px;
  }

  .overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 24px 8px 8px 10px;
    color: #fff;
    font-size: 12px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
    opacity: 0;
    transition: opacity 0.12s ease;

    .caption {
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    button {
      flex: 0 0 auto;
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
        background-color: rgba(0, 0, 0, 0.8);
      }
    }
  }

  &.clickable {
    cursor: pointer;
  }

  &:hover .overlay {
    opacity: 1;
  }
`;

type ImageProps = {
  className?: ClassNames;
  variant?: "single" | "tile";
  fileName: string;
  src: string;
  openUrl?: string;
  downloadUrl?: string;
  size?: number;
};

export const Image = ({
  className,
  variant = "single",
  fileName,
  src,
  openUrl,
  downloadUrl,
  size,
}: ImageProps) => (
  <ImageContainer
    className={cn("file", "image", variant, { clickable: !!openUrl }, className)}
    onClick={() => openUrl && window.open(openUrl)}
  >
    <img src={src} alt={fileName} loading="lazy" />
    <div className="overlay">
      <span className="caption" title={fileName}>
        {size ? `${fileName} · ${filesize(size)}` : fileName}
      </span>
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
    </div>
  </ImageContainer>
);
