import * as v from "valibot";
import {
  EntityId,
  MessageBody,
  MessageBodyBlockquote,
  MessageBodyBold,
  MessageBodyBr,
  MessageBodyBullet,
  MessageBodyChannel,
  MessageBodyCode,
  MessageBodyCodeblock,
  MessageBodyEmoji,
  MessageBodyImg,
  MessageBodyItalic,
  MessageBodyItem,
  MessageBodyLine,
  MessageBodyLink,
  MessageBodyOrdered,
  MessageBodyPart,
  MessageBodyStrike,
  MessageBodyText,
  MessageBodyThread,
  MessageBodyUnderline,
  MessageBodyUser,
} from "../types.ts";

export const Id = v.pipe(
  v.union([v.string(), v.instance(EntityId)]),
  v.transform((i: string) => EntityId.from(i)),
);
export const IdArr = v.pipe(
  v.array(v.union([v.string(), v.instance(EntityId)])),
  v.transform((i: string[]) => i.map(EntityId.from)),
);

export const vMessageBodyBullet: v.GenericSchema<MessageBodyBullet> = v.object({
  bullet: v.lazy(() => vMessageBody),
});
export const vMessageBodyOrdered: v.GenericSchema<MessageBodyOrdered> = v
  .object({ ordered: v.lazy(() => vMessageBody) });
export const vMessageBodyItem: v.GenericSchema<MessageBodyItem> = v.object({
  item: v.lazy(() => vMessageBody),
});
export const vMessageBodyCodeblock: v.GenericSchema<MessageBodyCodeblock> = v
  .object({ codeblock: v.string() });
export const vMessageBodyBlockquote: v.GenericSchema<MessageBodyBlockquote> = v
  .object({ blockquote: v.lazy(() => vMessageBody) });
export const vMessageBodyCode: v.GenericSchema<MessageBodyCode> = v.object({
  code: v.string(),
});
export const vMessageBodyLine: v.GenericSchema<MessageBodyLine> = v.object({
  line: v.lazy(() => vMessageBody),
});
export const vMessageBodyBr: v.GenericSchema<MessageBodyBr> = v.object({
  br: v.boolean(),
});
export const vMessageBodyText: v.GenericSchema<MessageBodyText> = v.object({
  text: v.string(),
});
export const vMessageBodyBold: v.GenericSchema<MessageBodyBold> = v.object({
  bold: v.lazy(() => vMessageBody),
});
export const vMessageBodyItalic: v.GenericSchema<MessageBodyItalic> = v.object({
  italic: v.lazy(() => vMessageBody),
});
export const vMessageBodyUnderline: v.GenericSchema<MessageBodyUnderline> = v
  .object({ underline: v.lazy(() => vMessageBody) });
export const vMessageBodyStrike: v.GenericSchema<MessageBodyStrike> = v.object({
  strike: v.lazy(() => vMessageBody),
});
export const vMessageBodyImg: v.GenericSchema<MessageBodyImg> = v.object({
  img: v.string(),
  _alt: v.string(),
});
export const vMessageBodyLink: v.GenericSchema<MessageBodyLink> = v.object({
  link: v.lazy(() => vMessageBody),
  _href: v.string(),
});
export const vMessageBodyEmoji: v.GenericSchema<MessageBodyEmoji> = v.object({
  emoji: v.string(),
});
export const vMessageBodyChannel: v.GenericSchema<MessageBodyChannel> = v
  .object({ channel: v.string() });
export const vMessageBodyUser: v.GenericSchema<MessageBodyUser> = v.object({
  user: v.string(),
});
export const vMessageBodyThread: v.GenericSchema<MessageBodyThread> = v.object({
  thread: v.string(),
  _channelId: v.string(),
  _parentId: v.string(),
});

export const vMessageBodyPart: v.GenericSchema<MessageBodyPart> = v.union([
  vMessageBodyBullet,
  vMessageBodyOrdered,
  vMessageBodyItem,
  vMessageBodyCodeblock,
  vMessageBodyBlockquote,
  vMessageBodyCode,
  vMessageBodyLine,
  vMessageBodyBr,
  vMessageBodyText,
  vMessageBodyBold,
  vMessageBodyItalic,
  vMessageBodyUnderline,
  vMessageBodyStrike,
  vMessageBodyImg,
  vMessageBodyLink,
  vMessageBodyEmoji,
  vMessageBodyChannel,
  vMessageBodyUser,
  vMessageBodyThread,
]);

export const vMessageBody: v.GenericSchema<MessageBody> = v.union([
  v.array(vMessageBodyPart),
  vMessageBodyPart,
]);
