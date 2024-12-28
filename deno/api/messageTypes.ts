import type { Eid, EncryptedData } from "./types.ts";

export type MessageBodyBullet = { bullet: MessageBody };
export type MessageBodyOrdered = { ordered: MessageBody };
export type MessageBodyItem = { item: MessageBody };
export type MessageBodyCodeblock = { codeblock: string };
export type MessageBodyBlockquote = { blockquote: MessageBody };
export type MessageBodyCode = { code: string };
export type MessageBodyLine = { line: MessageBody };
export type MessageBodyBr = { br: boolean };
export type MessageBodyText = { text: string };
export type MessageBodyBold = { bold: MessageBody };
export type MessageBodyItalic = { italic: MessageBody };
export type MessageBodyUnderline = { underline: MessageBody };
export type MessageBodyStrike = { strike: MessageBody };
export type MessageBodyImg = { img: string; _alt: string };
export type MessageBodyLink = { link: MessageBody; _href: string };
export type MessageBodyEmoji = { emoji: string };
export type MessageBodyChannel = { channel: string };
export type MessageBodyUser = { user: string };
export type MessageBodyButton = {
  button: string;
  _action: string;
  _style: string;
  _payload: any;
};
export type MessageBodyWrap = { wrap: MessageBody };
export type MessageBodyColumn = { column: MessageBody; _width: number };
export type MessageBodyThread = {
  thread: string;
  _channelId: string;
  _parentId: string;
};

export type MessageBodyPart =
  | MessageBodyBullet
  | MessageBodyOrdered
  | MessageBodyItem
  | MessageBodyCodeblock
  | MessageBodyBlockquote
  | MessageBodyCode
  | MessageBodyLine
  | MessageBodyBr
  | MessageBodyText
  | MessageBodyBold
  | MessageBodyItalic
  | MessageBodyUnderline
  | MessageBodyStrike
  | MessageBodyImg
  | MessageBodyLink
  | MessageBodyEmoji
  | MessageBodyChannel
  | MessageBodyUser
  | MessageBodyThread
  | MessageBodyButton
  | MessageBodyWrap
  | MessageBodyColumn;

export type MessageBody = MessageBodyPart[] | MessageBodyPart;

export type DateTime = "Deno" extends keyof typeof globalThis ? Date : string;

export type BaseMessage = {
  id: Eid;
  channelId: Eid;
  userId: Eid;
  parentId: Eid | null;
  pinned: boolean;
  clientId: string;
  appId?: string;

  updatedAt: DateTime;
  createdAt: DateTime;
};

export type MessageData = {
  flat: string;
  message: MessageBody;
  annotations?: MessageBody;
  emojiOnly: boolean;
  thread: Array<{
    userId: Eid;
    childId: Eid;
  }>;
  reactions: Array<{
    userId: Eid;
    reaction: string;
  }>;
  links: string[];
  mentions: string[];
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
  parsingErrors: any[];
  attachments: Array<{ // TODO make this a separate entity
    id: string;
    fileName: string;
    contentType: string;
  }>;
};

export type Message = BaseMessage & MessageData;
export type EncryptedMessage = BaseMessage & EncryptedData;
