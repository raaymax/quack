import React, { useEffect, useState } from 'react';
import { Emoji } from './Emoji';
import { Link } from '../atoms/Link';
import { ChannelLink } from './ChannelLink';
import { UserMention } from './UserMention';
import { ThreadLink } from './ThreadLink';
import { ActionButton } from '../atoms/ActionButton';
import * as types from '../../types';
import { Wrap } from '../atoms/Wrap';
import { useSelector } from '../../store';
import { encryptor } from '@quack/encryption';

function is<T extends types.MessageBodyPart>(body: types.MessageBodyPart, key: string): body is T {
  return (body as T)[key as keyof T] !== undefined;
}

const Encrypted = ({data, parent}: any) => {
  const [decrypted, setDecrypted] = useState<types.MessageBody | null>(null);
  const [error, setError] = useState(false);
  const config = useSelector((state) => state.config);
  const { encryptionKey = null, channels: channelKeys = [] } = config;
  const channelKey = channelKeys.find(c => c.channelId === parent.channelId)?.encryptionKey;

  useEffect(() => {
    if (!encryptionKey) return;
    encryptor(encryptionKey)
      .decrypt(channelKey)
      .then((key) => {
        encryptor(key)
          .decrypt(data)
          .then((decrypted) => setDecrypted(decrypted))
          .catch((e) => {
            console.log(e);
            setError(true);
          });
      });
  }, [data, parent]);

  if (error) return <><div>[ENCRYPTED MESSAGE]</div><code>{JSON.stringify(data)}</code></>;
  if (!decrypted) return null;
  return <MessageBodyRenderer body={decrypted} parent={parent} />;
}

type MessageBodyRendererProps = {
  body: types.MessageBody;
  parent: types.Message;
  opts?: {emojiOnly?: boolean};
}

export const MessageBodyRenderer = ({
  body,
  parent,
  opts,
}: MessageBodyRendererProps): React.ReactNode => {
  // FIXME: sanity check
  if (!body || typeof body === 'string') return body;
  if (Array.isArray(body)) {
    return <React.Fragment>{body.map((o, idx) => <MessageBodyRenderer body={o} parent={parent} opts={opts} key={idx} />)}</React.Fragment>;
  }
  if (is<types.MessageBodyBullet>(body, 'bullet')) return <ul><MessageBodyRenderer body={body.bullet} parent={parent} /></ul>;
  if (is<types.MessageBodyOrdered>(body, 'ordered')) return <ol><MessageBodyRenderer body={body.ordered} parent={parent} /></ol>;
  if (is<types.MessageBodyItem>(body, 'item')) return <li><MessageBodyRenderer body={body.item} parent={parent}/></li>;
  if (is<types.MessageBodyCodeblock>(body, 'codeblock')) return <pre>{body.codeblock}</pre>;
  if (is<types.MessageBodyBlockquote>(body, 'blockquote')) return <blockquote><MessageBodyRenderer body={body.blockquote} parent={parent} /></blockquote>;
  if (is<types.MessageBodyCode>(body, 'code')) return <code>{body.code}</code>;
  if (is<types.MessageBodyLine>(body, 'line')) return <p><MessageBodyRenderer body={body.line} parent={parent} /><br /></p>;
  if (is<types.MessageBodyBr>(body, 'br')) return <br />;
  if (is<types.MessageBodyText>(body, 'text')) return <React.Fragment>{body.text}</React.Fragment>;
  if (is<types.MessageBodyBold>(body, 'bold')) return <b><MessageBodyRenderer body={body.bold} parent={parent} opts={opts} /></b>;
  if (is<types.MessageBodyItalic>(body, 'italic')) return <em><MessageBodyRenderer body={body.italic} parent={parent} opts={opts} /></em>;
  if (is<types.MessageBodyUnderline>(body, 'underline')) return <u><MessageBodyRenderer body={body.underline} parent={parent} opts={opts} /></u>;
  if (is<types.MessageBodyStrike>(body, 'strike')) return <s><MessageBodyRenderer body={body.strike} parent={parent} opts={opts} /></s>;
  if (is<types.MessageBodyImg>(body, 'img')) return <img src={body.img} alt={body._alt} />;
  if (is<types.MessageBodyLink>(body, 'link')) return <Link href={body._href}><MessageBodyRenderer body={body.link} parent={parent} opts={opts} /></Link>;
  if (is<types.MessageBodyEmoji>(body, 'emoji')) return <Emoji size={opts?.emojiOnly ? 40 : 32} shortname={body.emoji} />;
  if (is<types.MessageBodyChannel>(body, 'channel')) return <ChannelLink channelId={body.channel} />;
  if (is<types.MessageBodyUser>(body, 'user')) return <UserMention userId={body.user} />;
  if (is<types.MessageBodyThread>(body, 'thread')) return <ThreadLink channelId={body._channelId} parentId={body._parentId} text={body.thread} />;
  if (is<types.MessageBodyButton>(body, 'button')) return <ActionButton action={body._action} style={body._style} payload={body._payload}>{body.button}</ActionButton>
  if (is<types.MessageBodyWrap>(body, 'wrap')) return <Wrap><MessageBodyRenderer body={body.wrap} parent={parent} opts={opts} /></Wrap>
  if (is<types.MessageBodyColumn>(body, 'column')) return <div style={{width: body.width+ 'px', flex: '0 0 ' + body.width+ 'px'}}><MessageBodyRenderer body={body.column} parent={parent} opts={opts} /></div>
  if (is<types.MessageBodyEncrypted>(body, 'encrypted')) return <Encrypted data={body} parent={parent} />
  return <>Unknown part: {JSON.stringify(body)}</>;
};
