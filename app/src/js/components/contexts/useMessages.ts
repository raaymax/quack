import {
  useMemo, useEffect, useState,
} from 'react';
import { useSelector, useDispatch, useMethods, useActions } from '../../store';
import { loadMessages, loadNext, loadPrevious } from '../../services/messages';
import { ViewMessage, MessageListArgs, Stream } from '../../types';
import { useMessageListArgs } from './useMessageListArgs';

export const useMessages = ({channelId, parentId}: {channelId: string, parentId?:string } ) => {
  const dispatch = useDispatch();
  const [args] = useMessageListArgs();
  const stream = useMemo(() => ({channelId, parentId, ...args}), [channelId, parentId, args]);
  const actions = useActions();
  const methods = useMethods();
  const messages = useSelector((state) => state.messages.data);
  const [prevStream, setPrevStream] = useState<Partial<Stream & MessageListArgs>>({});


  useEffect(() => {
    if (prevStream.channelId === stream.channelId
      && prevStream.parentId === stream.parentId) {
      return;
    }
    setPrevStream(stream);
    dispatch(loadMessages(stream));
    dispatch(methods.progress.loadProgress(stream));
  }, [dispatch, methods, stream, prevStream]);

  useEffect(() => {
    if (stream.type === 'live') {
      dispatch(actions.messages.clear({ stream }));
      dispatch(loadMessages(stream));
    }
  }, [stream.type]);

  return {
    messages: useMemo(
      () => messages
        .filter((m: ViewMessage) => m.channelId === stream.channelId 
                && (m.parentId === stream.parentId 
                  || (m.id && m.id === stream.parentId) 
                  || (!m.parentId && !stream.parentId))),
      [stream, messages],
    ),
    next: () => dispatch(loadNext(stream)).unwrap(),
    prev: () => dispatch(loadPrevious(stream)).unwrap(),
  };
};
