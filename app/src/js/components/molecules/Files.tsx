import styled from 'styled-components';
import { File } from '../atoms/File';
import { Image } from '../atoms/Image';
import { observer } from 'mobx-react-lite';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const RAW_IMAGE_TYPES = ['image/gif', 'image/webp'];


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

type FilesProps = {
  list: {
    id?: string;
    clientId?: string;
    fileName: string;
    contentType: string;
  }[];
};

export const Files = observer(({ list }: FilesProps) => list.length > 0 
  ? (
    <Container className='cmp-files'>
      <div className='file-list'>
        {list
          .filter((file) => IMAGE_TYPES.includes(file.contentType))
          .map((file) => (
            <div className='fli' key={file.id || file.clientId}>
              <Image
                raw={RAW_IMAGE_TYPES.includes(file.contentType)}
                data={file} />
            </div>
          ))}
      </div>
      <div className='file-list'>
        {list
          .filter((file) => !IMAGE_TYPES.includes(file.contentType))
          .map((file) => <File key={file.id || file.clientId} data={file} />)}
      </div>
    </Container>
  )
  : null);
