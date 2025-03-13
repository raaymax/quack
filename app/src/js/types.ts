export * from "@quack/api";
import { FullMessage } from "@quack/api";

export type ViewMessage = FullMessage & {
  progress?: ViewProgress[];
  info?: {
    type: "error" | "info";
    msg: string;
    action?: string;
  } | null;
  attachments?: {
    url: string;
  }[];
  editing?: boolean;
};

export type EmptyEmoji = {
  empty: true;
  shortname: string;
  category?: string;
};

export type DefinedEmoji = {
  empty?: false;
  unicode?: string;
  fileId?: string;
  shortname: string;
  category?: string;
};

export type EmojiDescriptor = EmptyEmoji | DefinedEmoji;

export type Notif = {
  id?: string;
  clientId: string;
  userId: string;
  notifType: string;
  notif: string;
  createdAt: string;
  ephemeral?: boolean;
};

export type Stream = {
  channelId: string;
  parentId?: string;
};

export type MessageListArgs = {
  id: string;
  type: "live" | "archive";
  selected?: string;
  date?: string;
};

export type Progress = {
  channelId: string;
  userId: string;
  parentId: string;
  count: number;
  lastMessageId: string;
};

export type ViewProgress = {
  userId: string;
  user: {
    id?: string;
    name: string;
    avatarUrl: string;
  };
};

export type Notification = {
  id: string;
  userId: string;
  channelId: string;
  parentId: string;
  createdAt: string;
  messageId: string;
};

export type UserConfig = {
  appVersion: string;
  mainChannelId: string;
};
