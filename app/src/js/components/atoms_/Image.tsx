import styled from "styled-components";
import { ClassNames, cn } from "../../utils";
import { observer } from "mobx-react-lite";

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
  className?: ClassNames;
  onClick?: (e: React.MouseEvent) => void;
  url?: string;
  fileName: string;
  caption?: string;
};

export const Image = observer(
  ({ className, onClick, url, fileName, caption}: ImageProps) => {
    return (
      <ImageContainer
        className={cn("file", "image", className)}
        onClick={onClick}
      >
        <img alt={fileName} src={url} />
        {caption && (
          <div className="caption">{caption}</div>
        )}
      </ImageContainer>
    );
  },
);
