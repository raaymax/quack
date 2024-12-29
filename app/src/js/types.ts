import { EncryptedData, MessageBody } from '@quack/api';
export * from '@quack/api';

/* global JsonWebKey */
/*
export type Message = {
  id?: string;
  clientId: string;
  message: MessageBody;
  flat: string;
  channelId: string;
  parentId: string;
  userId: string;
  appId: string;
  emojiOnly: boolean;
  createdAt: string;
  updatedAt: string;
  links: string[];
  pinned: boolean;
  editing: boolean;
  linkPreviews: {
    url: string;
    title: string;
    siteName: string;
    description: string;
    mediaType: string;
    contentType: string;
    images: string[];
    videos: string[];
    favicons: string[];
    charset: string;
  }[];
  attachments: {
    id: string;
    fileName: string;
    contentType: string;
    url?: string;
    size?: number;
  }[];
  reactions: {
    reaction: string;
    userId: string;
  }[];
  info?: {
    type: string;
    action?: string;
    msg: string;
  };
  thread?: {
    childId: string;
    userId: string;
  }[];
  // TODO: is it correct?
  progress?: {
    userId: string;
    user: {
      avatarUrl: string;
      name: string;
    }
  }[];
  priv?: boolean;
  encrypted?: boolean;
  annotations?: MessageBody;
};
*/

export type User = {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'away';
  avatar: string;
  publicKey: JsonWebKey;
  avatarFileId: string;
  connected: boolean;
  lastSeen: string;
  system: boolean;
};

export type EmptyEmoji= {
  empty: true,
  shortname: string
  category?: string,
}

export type DefinedEmoji = {
  empty?: false,
  unicode?: string,
  fileId?: string,
  shortname: string
  category?: string,
}

export type EmojiDescriptor = EmptyEmoji | DefinedEmoji;

export type Notif = {
  id?: string;
  clientId: string;
  userId: string;
  notifType: string;
  notif: string;
  createdAt: string;
  priv?: boolean;
}

export type Stream = {
  channelId: string,
  parentId?: string,
};

export type MessageListArgs = {
  id: string,
  type: 'live' | 'archive',
  selected?: string,
  date?: string,
};

export type Channel = {
  id: string;
  name: string;
  users: string[];
  channelType: string;
  priv?: boolean;
  direct?: boolean;
  private?: boolean;
  encryptionKey?: JsonWebKey | null;
};

export type Progress = {
  channelId: string;
  userId: string;
  parentId: string;
  count: number;
  lastMessageId: string;
}

export type Notification = {
  id: string;
  userId: string;
  channelId: string;
  parentId: string;
  createdAt: string;
  messageId: string;
}

export type UserConfig = {
  appVersion: string,
  mainChannelId: string,
  encryptionKey: JsonWebKey,
  channels: {
    channelId: string,
    encryptionKey: EncryptedData,
  }[]
}
