import React from 'react';
import { Message } from './Message';
import { DateSeparator } from '../atoms/DateSeparator';
import { cn, formatDate } from '../../utils';
import * as types from '../../types';
import { useNavigate } from 'react-router-dom';

export type MessageListRendererProps = {
  list: (types.ViewMessage| types.Notif)[];
  stream?: unknown;
  context?: unknown;
  onMessageClicked?: (msg: types.Message) => void;
};

function isNotif(data: types.Message | types.Notif): data is types.Notif {
  return (data as types.Notif).notif !== undefined;
}
export const BaseRenderer = ({
  list: messages, stream, context, onMessageClicked = (() => undefined),
}: MessageListRendererProps) => {
    const navigate = useNavigate();
  return (<>
    {[...messages].reverse().map((msg) => {
      return <React.Fragment key={`${msg.id}-${msg.clientId}`}>
        {isNotif(msg)
          ? <div
            className={cn('notification', msg.notifType)}>
            {msg.notif}
          </div>
          : <Message
            navigate={navigate}
            stream={stream}
            context={context}
            onClick={() => onMessageClicked(msg)}
            data-id={msg.id}
            data-date={msg.createdAt}
            client-id={msg.clientId}
            sameUser={false}
            data={msg}
          />}
      </React.Fragment>;
    }).reverse()}
  </>);
};

export const MessageListRenderer = ({
  list: messages, stream, context, onMessageClicked = (() => undefined),
}: MessageListRendererProps) => {
    const navigate = useNavigate();
  let prev: types.ViewMessage | types.Notif;
  return (<>
    {[...messages].reverse().map((msg) => {
      let sameUser = false;
      let sameDate = false;
      if (!msg.ephemeral) {
        sameUser = prev
          && prev?.userId === msg?.userId
          && (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 60000;
      }
      sameDate = prev
        && formatDate(prev?.createdAt) === formatDate(msg?.createdAt);
      prev = msg;
      return <React.Fragment key={`${msg.id}-${msg.clientId}`}>
        {isNotif(msg)
          ? <div
            className={cn('notification', msg.notifType)}>
            {msg.notif}
          </div>
          : <Message
            navigate={navigate}
            stream={stream}
            context={context}
            onClick={() => onMessageClicked(msg)}
            data-id={msg.id}
            data-date={msg.createdAt}
            client-id={msg.clientId}
            sameUser={sameUser}
            data={msg}
          />}
        {!sameDate ? <DateSeparator key={`date:${msg.createdAt}`} date={msg.createdAt} /> : null}
      </React.Fragment>;
    }).reverse()}
  </>);
};
