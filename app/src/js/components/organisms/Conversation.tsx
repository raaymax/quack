import { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  useDispatch, useSelector, useProgress, useMethods,
} from '../../store';
import { MessageList } from './MessageListScroller';
import { uploadMany } from '../../services/file';
import { Input } from './Input';
import { HoverProvider } from '../contexts/hover';
import { LoadingIndicator } from '../molecules/LoadingIndicator';
import { useMessageListArgs } from '../contexts/useMessageListArgs';
import { ClassNames, cn } from '../../utils';
import { observer } from 'mobx-react-lite';
import { useApp } from '../contexts/appState';

export const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  & > .message-list-container {
    flex: 0 100 100%;
  }
  & > .input-container {
    flex: 100 0 auto;
  }
`;

export const Conversation = observer(({channelId, parentId, className}: {channelId: string, parentId?: string, className?: ClassNames}) => {
  const [args, setArgs] = useMessageListArgs();
  const dispatch = useDispatch();
  const methods = useMethods();
  const progress = useProgress({ channelId: channelId, parentId: parentId });
  const app = useApp();
  const messagesModel = app.getMessages(channelId, parentId);
  const list = messagesModel.getAll();

  //const list: MessageType[] = messages.map((m: MessageType) => ({ ...m, progress: progress[m.id ?? ''] }));
  const drop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { files } = e.dataTransfer;

    dispatch(uploadMany({ streamId: args.id, files }));
  }, [dispatch, channelId, parentId]);

  const dragOverHandler = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
  }, []);

  const bumpProgress = useCallback(() => {
    const latest = list.find(({ ephemeral }) => !ephemeral);
    if (latest?.id) dispatch(methods.progress.update(latest.id));
  }, [methods, list, dispatch]);

  useEffect(() => {
    app.getMessages(channelId, parentId).load();
  }, [])

  useEffect(() => {
    window.addEventListener('focus', bumpProgress);
    return () => {
      window.removeEventListener('focus', bumpProgress);
    };
  }, [bumpProgress]);

  return (
    <Container className={cn(className)} onDrop={drop} onDragOver={dragOverHandler}>
      <HoverProvider>
        <MessageList
          model={messagesModel}
          className="message-list-container"
          onDateChange={(date) => setArgs({ ...args, date })}
          onScrollTop={async () => {
            console.log('loadPrev');
            await messagesModel?.loadPrev();
            setArgs({ ...args, type: 'archive', selected: undefined });
            bumpProgress();
          }}
          onScrollBottom={async () => {
            console.log('loadNext');
            const count = await messagesModel?.loadNext();
            if (count === 1) {
              setArgs({ ...args, type: 'live', selected: undefined });
            }
            bumpProgress();
          }}
        />
        <LoadingIndicator />
        <Input className="input-container" channelId={channelId} parentId={parentId}/>
      </HoverProvider>
    </Container>
  );
})

