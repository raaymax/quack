import React from 'react';
import { Message } from './Message';
import { cn, formatDate } from '../../utils';
import * as types from '../../types';
import { useNavigate } from 'react-router-dom';

import { observer } from 'mobx-react-lite';
import type { MessagesModel } from '../../core/models/messages';
import type { MessageModel } from '../../core/models/message';
import { DateSeparator } from '../atoms/DateSeparator';
import { ReadReceipt } from '../molecules/ReadReceipt';

export type MessageListRendererProps = {
  model: MessagesModel;
  context?: unknown;
  onMessageClicked?: (msg: MessageModel) => void;
};

export const BaseRenderer = observer(({
  model, context, onMessageClicked = (() => undefined),
}: MessageListRendererProps) => {
    const navigate = useNavigate();
  return (<>
    {[...model.list].reverse().map((msg: MessageModel) => {
      return <Message
            key={`${msg.id}-${msg.clientId}`}
            model={msg}
            navigate={navigate}
            context={context}
            onClick={() => onMessageClicked(msg)}
            data-id={msg.id}
            data-date={msg.createdAt}
            client-id={msg.clientId}
            sameUser={false}
            data={msg}
          />;
    }).reverse()}
  </>);
});

export const MessageListRenderer = observer(({
  model, context, onMessageClicked = (() => undefined),
}: MessageListRendererProps) => {
    const navigate = useNavigate();
  let prev: MessageModel;
  const readReceipts = model.getReadReceipts();
  console.log('rendering conversation', model.list.length);
  return (<>
    {[...model.list].reverse().map((msg) => {
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
        <ReadReceipt model={readReceipts.filter((r) => r.lastMessageId === msg.id)} />
        <Message
            model={msg}
            navigate={navigate}
            context={context}
            onClick={() => onMessageClicked(msg)}
            data-id={msg.id}
            data-date={msg.createdAt}
            client-id={msg.clientId}
            sameUser={sameUser}
            data={msg}
          />
        {!sameDate ? <DateSeparator key={`date:${msg.createdAt}`} date={msg.createdAt} /> : null}
      </React.Fragment>
    }).reverse()}
  </>);
});
