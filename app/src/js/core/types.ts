import { MessageBody } from '../types';

export type OutgoingPayload = (
  OutgoingChannelCreate
  | OutgoingChannelGet
  | OutgoingChannelGetAll
  | OutgoingCommandExecute
  | OutgoingEmojiGet
  | OutgoingEmojiGetAll
  | OutgoingMessageCreate
  | OutgoingMessageGetAll
  | OutgoingMessagePin
  | OutgoingMessagePins
  | OutgoingMessageReact
  | OutgoingMessageRemove
  | OutgoingMessageSearch
  | OutgoingMessageUpdate
  | OutgoingReadReceiptGetChannel
  | OutgoingReadReceiptGetOwn
  | OutgoingReadReceiptUpdate
  | OutgoingUserConfig
  | OutgoingUserGetAll
  | OutgoingUserPushSubscribe
  | OutgoingUserTyping
);

export type OutgoingChannelCreate = {
  type: 'channel:create',
  channelType?: 'PUBLIC' | 'PRIVATE' | 'DIRECT',
  name: string,
  users?: string[]
};

export type OutgoingChannelGet = {
  type: 'channel:get',
  id: string,
}

export type OutgoingChannelGetAll = {
  type: 'channel:getAll',
}

export type OutgoingCommandExecute = {
  type: 'command:execute',
  name: string,
  args: string[],
  attachments?: Array<{
    id: string,
    fileName: string,
    contentType?: string,
  }>,
  context: {
    channelId: string,
    parentId?: string,
    appVersion?: string,
  },
}

export type OutgoingEmojiGet = {
  type: 'emoji:get',
  shortname: string,
}

export type OutgoingEmojiGetAll = {
  type: 'emoji:getAll',
}
export type OutgoingMessageCreate = {
  type: 'message:create',
  message: MessageBody,
  channelId: string,
  parentId?: string | null,
  flat: string,
  clientId: string,
  emojiOnly?: boolean,
  debug?: string,
  links?: string[],
  mentions?: string[],
  attachments?: Array<{
    id: string,
    fileName: string,
    contentType?: string,
  }>
}

export type OutgoingMessageGetAll = {
  type: 'message:getAll',
  channelId: string,
  parentId?: string,
  pinned?: string,
  before?: string,
  after?: string,
  limit?: number,
}
export type OutgoingMessagePin = {
  type: 'message:pin',
  id: string,
  pinned: boolean,
}

export type OutgoingMessagePins = {
  type: 'message:pins',
  channelId: string,
  before?: string,
  after?: string,
  limit?: number,
}

export type OutgoingMessageReact = {
  type: 'message:react',
  id: string,
  reaction: string,
}

export type OutgoingMessageRemove = {
  type: 'message:remove',
  id: string,
}

export type OutgoingMessageSearch = {
  type: 'message:search',
  channelId: string,
  text: string,
  limit?: number,
}

export type OutgoingMessageUpdate = {
  type: 'message:update',
  id: string,
  message?: string,
  channelId?: string,
  flat?: string,
  clientId?: string,
  pinned?: boolean,
  attachments?: Array<{
    id: string,
    fileName: string,
    contentType?: string,
  }>,
}

export type OutgoingReadReceiptGetChannel = {
  type: 'readReceipt:getChannel',
  channelId: string,
  parentId?: string | null,
}

export type OutgoingReadReceiptGetOwn = {
  type: 'readReceipt:getOwn',
}

export type OutgoingReadReceiptUpdate = {
  type: 'readReceipt:update',
  messageId: string,
}

export type OutgoingUserConfig = {
  type: 'user:config',
}

export type OutgoingUserGetAll = {
  type: 'user:getAll',
}

export type OutgoingUserPushSubscribe = {
  type: 'user:push:subscribe',
  endpoint?: string,
  expirationTime?: number | null,
  keys: {
    auth: string,
    p256dh: string,
  }
}

export type OutgoingUserTyping = {
  type: 'user:typing',
  channelId: string,
  parentId?: string | null,
}

export type IncommingError = {
  status: 'error',
  message?: string,
  res: {
    message: string,
  },
}
