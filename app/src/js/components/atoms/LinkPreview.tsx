import styled from 'styled-components';
import { observer } from 'mobx-react-lite';


const Container = styled.div`
  display: flex;
  flex-direction: row;
  max-width: calc(100vw - 30px);
  flex-wrap: wrap;
`;

const Link = styled.div<{$image: string}>`
  flex: 0 0 300px;
  display: block;
  max-width: 300px;
  border-left: 2px solid ${(props) => props.theme.Labels};
  border-radius: 0;
  padding: 10px;  
  margin-bottom: 10px;
  margin-right: 10px;
  cursor: pointer;

  .text {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: pre-wrap;
    font-size: 0.8em;
  }
  * {
    cusor: pointer;
  }  
  
  
  .image {
    width: 100%;
    height: 150px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url(${(props) => props.$image});
  }
  
  img {
    max-width: 100%;
    height: 150px;
  }
  &:hover {
    border-color: ${(props) => props.theme.borderColorHover};
  }
`;

type Link = {
  url: string;
  siteName: string;
  title: string;
  description: string;
  images: string[];
};

type LinkPreviewProps = {
  link: Link;
};

export const LinkPreview = observer(({ link }: LinkPreviewProps) => (
  <Link className='link-preview' onClick={() => window.open(link.url, '_blank')?.focus()}
    $image={link.images[0]}>
    {link.images?.length && <div className='image' />}
    <div className='text'>
      <h3>{link.siteName} - {link.title}</h3>
      <p>{link.description}</p>
    </div>
  </Link>
));

type LinkPreviewListProps = {
  links: Link[];
};

export const LinkPreviewList = observer(({ links = [] }: LinkPreviewListProps) => links.length > 0
  ? (
    <Container className="cmp-link-preview-list">
      {links.map((link, key) => (
        <LinkPreview link={link} key={key} />
      ))}
    </Container>
  )
  : null);
