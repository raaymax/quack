import * as v from "valibot";
import { EntityId, MessageBody, MessageBodyPart, User } from "@quack/api";
export * from "@quack/api";

export type DbUser = User & {
  password?: string;
  resetToken?: string;

  secrets: {
    password: { hash: string; data: EncryptedData; createdAt: Date };
    backup?: { hash: string; data: EncryptedData; createdAt: Date };
  };

  mainChannelId: EntityId;
};

export type Secret = {
  hash: string;
  data: {
    encrypted: string;
    _iv: string;
  };
  createdAt: Date;
};

export type Interaction = {
  userId: EntityId;
  channelId: EntityId;
  parentId?: EntityId;
  clientId: string;
  action: string;
  payload?: any;
};

export type Config = {
  appVersion: string;
  mainChannelId: EntityId;
  encryptionKey: JsonWebKey;
  channels: {
    channelId: EntityId;
    encryptionKey: JsonWebKey;
  }[];
};

export type Webhook = {
  url: string;
  events?: string[];
};

export type Session = {
  id: EntityId;
  expires: Date;
  userId: EntityId;
  token: string;
  lastIp: string;
  lastUserAgent: string;
};

export type EncryptedData = {
  encrypted: string;
  _iv: string;
};

export enum ChannelType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  DIRECT = "DIRECT",
}

export type Channel = {
  id: EntityId;
  channelType: ChannelType;
  name: string;
  cid: string;
  private: boolean;
  direct: boolean;
  users: EntityId[];
  encrypted: boolean;
  encryptionKey: JsonWebKey | null;
};

// Replaces all EntityId with string recursively
export type ReplaceEntityId<T> = T extends EntityId ? string : (
  T extends object ? {
      [K in keyof T]: ReplaceEntityId<T[K]>;
    }
    : (
      T extends any[] ? ReplaceEntityId<T[number]>[] : T
    )
);

export type Emoji = {
  id: EntityId;
  shortname: string;
  fileId: string;
};

export type Badge = {
  id: EntityId;
  count: number;
  channelId: EntityId;
  parentId: EntityId | null;
  userId: EntityId;
  lastRead: Date;
  lastMessageId: EntityId;
};

export type Invitation = {
  id: EntityId;
  token: string;
  userId: EntityId;
  channelId: EntityId;
  expireAt: Date;
  createdAt: Date;
};

export const vMessageBodyPart: v.GenericSchema<MessageBodyPart> = v.union([
  v.object({ bullet: v.lazy(() => vMessageBody) }),
  v.object({ ordered: v.lazy(() => vMessageBody) }),
  v.object({ item: v.lazy(() => vMessageBody) }),
  v.object({ codeblock: v.string() }),
  v.object({ blockquote: v.lazy(() => vMessageBody) }),
  v.object({ code: v.string() }),
  v.object({ line: v.lazy(() => vMessageBody) }),
  v.object({ br: v.boolean() }),
  v.object({ text: v.string() }),
  v.object({ bold: v.lazy(() => vMessageBody) }),
  v.object({ italic: v.lazy(() => vMessageBody) }),
  v.object({ underline: v.lazy(() => vMessageBody) }),
  v.object({ strike: v.lazy(() => vMessageBody) }),
  v.object({ img: v.string(), _alt: v.string() }),
  v.object({ link: v.lazy(() => vMessageBody), _href: v.string() }),
  v.object({ emoji: v.string() }),
  v.object({ channel: v.string() }),
  v.object({ user: v.string() }),
  v.object({
    button: v.string(),
    _action: v.string(),
    _style: v.string(),
    _payload: v.any(),
  }),
  v.object({ wrap: v.lazy(() => vMessageBody) }),
  v.object({ column: v.lazy(() => vMessageBody), _width: v.number() }),
  v.object({
    thread: v.string(),
    _channelId: v.string(),
    _parentId: v.string(),
  }),
]);

export const vMessageBody: v.GenericSchema<MessageBody> = v.union([
  v.array(vMessageBodyPart),
  vMessageBodyPart,
]);

export type ReplaceType<T, R, W> = T extends R ? W : (
  T extends object ? {
      [K in keyof T]: ReplaceType<T[K], R, W>;
    }
    : (
      T extends any[] ? ReplaceType<T[number], R, W>[] : T
    )
);

export const Id = v.pipe(
  v.string(),
  v.transform((i: string) => EntityId.from(i)),
);
