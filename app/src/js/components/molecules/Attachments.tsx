import { useMemo } from 'react';
import { filesize } from 'filesize';
import styled from 'styled-components';
import { useMessageListArgs } from '../contexts/useMessageListArgs';
import { ClassNames, cn } from '../../utils';
import { observer } from 'mobx-react-lite';
import { useApp } from '../contexts/appState';

const Container = styled.div`
  .attachment-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 16px;
  }


  .attachment {
    flex: 0 0 224px;
    position: relative;
    height: 30px;
    padding: 0;
    width: 224px;
    height: 64px;

    .attachment-box {
      position: relative;
      width: 100%;
      height: 100%;
      padding: 8px;
      border: 1px solid ${props => props.theme.Strokes};
      overflow: hidden;
      border-radius: 8px;
      flex-direction: row;
      display: flex;
    }

    .type {
      line-height: 48px;
      width: 48px;
      height: 48px;
      text-align: center;
      vertical-align: middle;
    }
    .text {
      flex: 1 100%;
      overflow: hidden;
      

      .name {
        padding-left: 10px;
        line-height: 28px;
        vertical-align: middle;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .description {
        padding-left: 10px;
        line-height: 20px;
        vertical-align: middle;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: ${props => props.theme.Strokes};
      }
    }
  
    .remove {
      display: none;
      position: absolute;
      top: -12px;
      right: 9px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${props => props.theme.Strokes};
      color: white;
      line-height: 24px;
      cursor: pointer;
      text-align: center;
      vertical-align: middle;
      &:hover {
        background-color: var(--primary_active_mask);
      }
    }

    &:hover .remove {
      display: block;
    }

    .progress {
      background-color: #216dad;
      position: absolute;
      left: 0;
      bottom: 0;
      height: 3px;
    }

    .progress.done {
      background-color: green;
    }
  }

  .progress {
    background-color: #216dad;
    height: 3px;

  }
`;

type AttachmentProps = {
  data: {
    fileName: string;
    contentType: string;
    fileSize: number;
    progress: number;
    status: string;
  };
  onDelete: () => void;
};

export const Attachment = observer(({
  data: {
    fileName, contentType, progress, status, fileSize,
  },
  onDelete,
}: AttachmentProps) => (
  <div className='attachment'>
    <div className='attachment-box'>
      <div className='type'><img src="/attachment.svg" /> </div>
      <div className='text'>
        <div className='name'>{fileName}</div>
        <div className='description'>{contentType} {filesize(fileSize)}</div>
      </div>
      <div className={status === 'ok' ? 'progress done' : 'progress'} style={{ width: `${progress}%` }} />
    </div>
    <div className='remove' onClick={onDelete}><i className='fa-solid fa-xmark' /></div>
  </div>
));

export const Attachments = observer(({className}: {className?:ClassNames}) => {
  const [args] = useMessageListArgs();
  const app = useApp();
  const files = app.files.getAll();
  const list = useMemo(() => files.filter((file) => file.streamId === args.id), [files, args.id]);

  //const totalSize = list.reduce((acc, file) => acc + file.fileSize, 1);
  //const progress = list.reduce((acc, file) => acc + file.progress * file.fileSize, 1) / totalSize;
  const hasFiles = list.length > 0;

  return (
    <Container className={cn(className)}>
      {hasFiles && 
        <div className='attachment-list'>
          {list.map((file) => (
            <Attachment
              key={file.clientId}
              data={{ ...file }}
              onDelete={() => {
                app.files.abort(file.clientId);
              }}
            />
          ))}
        </div>
      }
      {/*<div className={status === 'ok' ? 'progress done' : 'progress'} style={{ width: `${progress}%` }} />*/}
    </Container>
  );
});
