/* global JsonWebKey */
import { client } from '../core';
import { createCounter } from '../utils';
import {
  createMethod, StateType, DispatchType, ActionsType,
} from '../store';
import { Stream, Message, ViewMessage, ApiErrorResponse } from '../types';
import { IncommingError, OutgoingCommandExecute, OutgoingMessageCreate } from '../core/types';

declare global {
  const APP_VERSION: string;
}

const tempId = createCounter(`temp:${(Math.random() + 1).toString(36)}`);

const loading = (dispatch: DispatchType, actions: ActionsType) => {
  dispatch(actions.messages.loading());
  const timer = setTimeout(() => dispatch(actions.messages.loadingDone()), 1000);
  return () => {
    dispatch(actions.messages.loadingDone());
    clearTimeout(timer);
  };
};

const getStreamMessages = (stream: Stream, messages: Message[]) => messages
  .filter((m) => m.channelId === stream.channelId
    && (
      ((!stream.parentId && !m.parentId) || m.parentId === stream.parentId)
    || (!stream.parentId && m.parentId === m.id)));

export const selectors = {
  countMessagesInStream: (stream: Stream, state: StateType) => getStreamMessages(stream, state.messages.data).length,
  getLatestDate: (stream: Stream, state: StateType) => {
    const data = getStreamMessages(stream, state.messages.data)
      .filter((m) => m.id !== stream.parentId);

    // FIXME: optimize this
    const dates = data.map((m) => new Date(m.createdAt).getTime());
    const max = Math.max(...dates);
    try{
      return new Date(max).toISOString();
    }catch(e){
      return new Date().toISOString();
    }
  },
  getEarliestDate: (stream: Stream, state: StateType) => {
    const data = getStreamMessages(stream, state.messages.data)
      .filter((m) => m.id !== stream.parentId);
    // FIXME: optimize this
    const dates = data.map((m) => new Date(m.createdAt).getTime());
    const min = Math.min(...dates);
    try{
      return new Date(min).toISOString();
    }catch(e){
      return new Date().toISOString();
    }
    //return data.length ? data[data.length - 1].createdAt : new Date().toISOString();
  },
  getMessage: (id: string, state: StateType): ViewMessage | null => state.messages.data
    .find((m) => m.id === id || m.clientId === id) || null,
};

export const loadPrevious = createMethod('messages/loadPrevious', async (stream: Stream, {
  dispatch, getState, methods, actions,
}) => {
  if (getState().messages.loading) return;
  const loadingDone = loading(dispatch, actions);
  const date = selectors.getEarliestDate(stream, getState());

  await dispatch(methods.messages.load({
    ...stream,
    before: date,
  }));
  if (selectors.countMessagesInStream(stream, getState()) > 100) {
    setTimeout(() => {
      dispatch(actions.messages.takeOldest({ stream, count: 100 }));
    }, 10);
  }
  loadingDone();
});

export const loadNext = createMethod('messages/loadNext', async (stream: Stream, {
  dispatch, getState, methods, actions,
}): Promise<number | null> => {
  if (getState().messages.loading) return null;
  const loadingDone = loading(dispatch, actions);
  const date = selectors.getLatestDate(stream, getState());

  const messages = await dispatch(methods.messages.load({
    ...stream,
    after: date,
  })).unwrap();
  if (messages && messages?.length > 0) {
    dispatch(methods.progress.update(messages[0].id));
  }
  if (selectors.countMessagesInStream(stream, getState()) > 100) {
    setTimeout(() => {
      dispatch(actions.messages.takeYoungest({ stream, count: 100 }));
    }, 10);
  }
  loadingDone();
  return messages?.length ?? 0;
});

export const loadMessagesArchive = createMethod('messages/loadMessagesArchive', async (stream: Stream, { dispatch, actions, methods }) => {
  if (!stream.channelId) return;
  const { date } = {date: new Date().toISOString()}; //  = stream; // FIXME: get date from stream
  const loadingDone = loading(dispatch, actions);
  dispatch(actions.messages.clear({ stream }));
  await dispatch(methods.messages.load({
    ...stream,
    before: date,
  }));
  const messages = await dispatch(methods.messages.load({
    ...stream,
    after: date,
  })).unwrap();
  if (messages && messages?.length > 0) dispatch(methods.progress.update(messages[0].id));
  loadingDone();
});

export const loadMessagesLive = createMethod('messages/loadMessagesLive', async (stream: Stream, { dispatch, actions, methods }) => {
  if (!stream.channelId) return;
  const loadingDone = loading(dispatch, actions);
  const messages = await dispatch(methods.messages.load(stream)).unwrap();
  if (messages && messages?.length > 0) dispatch(methods.progress.update(messages[0].id));
  loadingDone();
});

export const loadMessages = createMethod('messages/loadMessages', async (stream: Stream, { dispatch }) => {
  //if (stream.type === 'archive') {
  //  dispatch(loadMessagesArchive(stream));
  //} else {
    dispatch(loadMessagesLive(stream));
  //}
});

type SendArgs = {
  stream: Stream;
  payload: OutgoingMessageCreate | OutgoingCommandExecute;
};

export const send = createMethod('messages/send', async ({ stream, payload }: SendArgs, { dispatch, methods }) => {
  if (payload.type === 'message:create') {
    dispatch(methods.messages.sendMessage({ payload }));
  }
  if (payload.type === 'command:execute') {
    dispatch(sendCommand({ stream, payload }));
  }
});

const isError = (err: unknown): err is IncommingError => (err as IncommingError).status === 'error';

export const sendCommand = createMethod('messages/sendCommand', async ({ stream, payload: msg }: {payload: OutgoingCommandExecute, stream: Stream}, { dispatch, actions, getState }) => {
  const notif = {
    clientId: tempId(),
    type: 'notif',
    userId: getState().me,
    channelId: stream.channelId,
    parentId: stream.parentId,
    notifType: 'info',
    notif: `${msg.name} sent`,
    createdAt: (new Date()).toISOString(),
  };
  msg.context = { ...stream, appVersion: APP_VERSION };
  dispatch(actions.messages.add(notif));
  try {
    const res = await client.req(msg);
    if (res.status === 'error') throw res;
    dispatch(actions.messages.add({ ...notif, notifType: 'success', notif: `${msg.name} executed successfully` }));
  } catch (err) {
    try {
      if (err instanceof ApiErrorResponse) {
        dispatch(actions.messages.add({ ...notif, notifType: 'error', notif: `command "${msg.name}" error: ${ err.error ?? err.message}` }));
      }
      if (!isError(err)) return console.error(err);
    } catch (e) {
      console.log(e);
    }
  }
});


export const resend = createMethod('messages/resend', async (id: string, { dispatch, getState, methods }) => {
  const msg = selectors.getMessage(id, getState());
  if (!msg) return;
  await dispatch(methods.messages.sendMessage({
    payload: {
      ...msg,
    },
  }));
});

export const removeMessage = createMethod('messages/removeMessage', async (msg: {id: string}, { dispatch, actions }) => {
  try {
    await client.req({ type: 'message:remove', id: msg.id });
  } catch (err) {
    dispatch(actions.messages.add({
      id: msg.id,
      notifType: null,
      notif: null,
      info: {
        type: 'error',
        msg: 'Could not delete message',
      },
    }));
  }
});

