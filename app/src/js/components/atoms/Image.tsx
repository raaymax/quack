import styled from 'styled-components';
import { getUrl, getThumbnail } from '../../services/file';
import { ClassNames, cn } from '../../utils';
import {filesize} from "filesize"
import { observer } from 'mobx-react-lite';

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

const download = async (fileId: string) => {
  window.open(getUrl(fileId));
};

type ImgProps = {
  raw?: boolean;
  fileName: string;
  id?: string;
  url?: string;
};

type ImageProps = {
  raw?: boolean;
  className?: ClassNames
  data: {
    id?: string;
    clientId?: string;
    fileName: string;
    url?: string;
    size?: number;
  };
};

const Img = ({raw, fileName, id, url}: ImgProps) => {
  if (url) {
    return <img src={url} alt={fileName} />;
  } else if (raw) {
    return <img className='raw-image' src={getUrl(id ?? '')} alt={fileName} />;
  } else {
    return <img src={getThumbnail(id ?? '', {h: 240})} alt={fileName} />;
  }
}

export const Image = observer(({ className, raw, data: { fileName, id, url, size} }: ImageProps) => {
  const formattedSize = filesize(size ?? 0);

  return (
    <ImageContainer className={cn('file', 'image', className)} data-id={id} onClick={() => id && download(id)}>
      <Img raw={raw} fileName={fileName} id={id} url={url} />
      {(fileName || size) && <div className="caption">{[fileName, formattedSize].join(', ')}</div>}
    </ImageContainer>
  );
})
