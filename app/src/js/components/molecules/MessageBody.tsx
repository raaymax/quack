import React from 'react';
import { Emoji } from './Emoji';
import { Link } from '../atoms/Link';
import { ChannelLink } from './ChannelLink';
import { UserMention } from './UserMention';
import { ThreadLink } from './ThreadLink';
import { ActionButton } from '../atoms/ActionButton';
import * as types from '../../types';
import { Wrap } from '../atoms/Wrap';

function is<T extends types.MessageBodyPart>(body: types.MessageBodyPart, key: string): body is T {
  return (body as T)[key as keyof T] !== undefined;
}

type MessageBodyRendererProps = {
  body: types.MessageBody;
  opts?: {emojiOnly?: boolean};
}

export const MessageBodyRenderer = ({
  body,
  opts,
}: MessageBodyRendererProps): React.ReactNode => {
  if (!body || typeof body === 'string') return body;
  if (Array.isArray(body)) {
    return <React.Fragment>{body.map((o, idx) => <MessageBodyRenderer body={o} opts={opts} key={idx} />)}</React.Fragment>;
  }
  if (is<types.MessageBodyBullet>(body, 'bullet')) return <ul><MessageBodyRenderer body={body.bullet} /></ul>;
  if (is<types.MessageBodyOrdered>(body, 'ordered')) return <ol><MessageBodyRenderer body={body.ordered} /></ol>;
  if (is<types.MessageBodyItem>(body, 'item')) return <li><MessageBodyRenderer body={body.item} /></li>;
  if (is<types.MessageBodyCodeblock>(body, 'codeblock')) return <pre>{body.codeblock}</pre>;
  if (is<types.MessageBodyBlockquote>(body, 'blockquote')) return <blockquote><MessageBodyRenderer body={body.blockquote} /></blockquote>;
  if (is<types.MessageBodyCode>(body, 'code')) return <code>{body.code}</code>;
  if (is<types.MessageBodyLine>(body, 'line')) return <p><MessageBodyRenderer body={body.line} /><br /></p>;
  if (is<types.MessageBodyBr>(body, 'br')) return <br />;
  if (is<types.MessageBodyText>(body, 'text')) return <React.Fragment>{body.text}</React.Fragment>;
  if (is<types.MessageBodyBold>(body, 'bold')) return <b><MessageBodyRenderer body={body.bold} opts={opts} /></b>;
  if (is<types.MessageBodyItalic>(body, 'italic')) return <em><MessageBodyRenderer body={body.italic} opts={opts} /></em>;
  if (is<types.MessageBodyUnderline>(body, 'underline')) return <u><MessageBodyRenderer body={body.underline} opts={opts} /></u>;
  if (is<types.MessageBodyStrike>(body, 'strike')) return <s><MessageBodyRenderer body={body.strike} opts={opts} /></s>;
  if (is<types.MessageBodyImg>(body, 'img')) return <img src={body.img} alt={body._alt} />;
  if (is<types.MessageBodyLink>(body, 'link')) return <Link href={body._href}><MessageBodyRenderer body={body.link} opts={opts} /></Link>;
  if (is<types.MessageBodyEmoji>(body, 'emoji')) return <Emoji size={opts?.emojiOnly ? 40 : 32} shortname={body.emoji} />;
  if (is<types.MessageBodyChannel>(body, 'channel')) return <ChannelLink channelId={body.channel} />;
  if (is<types.MessageBodyUser>(body, 'user')) return <UserMention userId={body.user} />;
  if (is<types.MessageBodyThread>(body, 'thread')) return <ThreadLink channelId={body._channelId} parentId={body._parentId} text={body.thread} />;
  if (is<types.MessageBodyButton>(body, 'button')) return <ActionButton action={body._action} style={body._style} payload={body._payload}>{body.button}</ActionButton>
  if (is<types.MessageBodyWrap>(body, 'wrap')) return <Wrap><MessageBodyRenderer body={body.wrap} opts={opts} /></Wrap>
  if (is<types.MessageBodyColumn>(body, 'column')) return <div style={{width: body._width+ 'px', flex: '0 0 ' + body._width+ 'px'}}><MessageBodyRenderer body={body.column} opts={opts} /></div>
  return <>Unknown part: {JSON.stringify(body)}</>;
};
