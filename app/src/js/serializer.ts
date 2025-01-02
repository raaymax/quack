import { createCounter } from './utils';
import { MessageBody, MessageBodyPart } from './types';
import * as types from './types';

type SerializeError = {
  message: string;
  nodeAttributes: Record<string, string | null>;
  nodeName: string;
}

export type MessageToSend = {
  type: 'message:create';
  clientId: string;
  createdAt: string;
  info: null;
  message: MessageBody;
  flat: string;
  parsingErrors?: SerializeError[];
  emojiOnly?: boolean;
};


export type MessageToUpdate = {
  type: 'message:update';
  clientId: string;
  createdAt: string;
  info: null;
  id: string;
  message: MessageBody;
  flat: string;
  parsingErrors?: SerializeError[];
  emojiOnly?: boolean;
};

export type CommandToSend = {
  type: 'command:execute';
  clientId: string;
  createdAt: string;
  info: null;
  name: string;
  text: string;
  flat: string;
};

export type SerializeInfo = {
  links: string[];
  mentions: string[];
  errors?: SerializeError[];
};

export const fromDom = (dom: HTMLElement): MessageToSend | CommandToSend | MessageToUpdate => {
  const command = (dom.textContent ?? '').trim().match(/^\/\w+( \S+)*/);
  if (command) {
    const m = (dom.textContent ?? '').trim().replace('\n', '').slice(1).split(/\s+/);
    return {
      type: 'command:execute',
      clientId: tempId(),
      createdAt: new Date().toISOString(),
      info: null,
      name: m[0],
      text: m.splice(1).join(' '),
      flat: dom.textContent ?? '',
    };
  }

  if (dom.childNodes.length === 0) {
    return {
      type: 'message:create',
      clientId: tempId(),
      createdAt: new Date().toISOString(),
      info: null,
      message: [],
      flat: '',
    };
  }
  const info: SerializeInfo = {
    links: [],
    mentions: [],
  };
  const tree = mapNodes(dom, info);

  return {
    type: 'message:create',
    clientId: tempId(),
    createdAt: new Date().toISOString(),
    info: null,
    message: trim(tree),
    emojiOnly: isEmojiOnly(tree),
    flat: flatten(tree),
    parsingErrors: info.errors,
    ...info,
  };
};
function is<T extends MessageBodyPart>(data: MessageBodyPart, key: string): data is T {
  return (data as T)[key as keyof T] !== undefined;
}
// FIXME: There is no way of searching messages using mentions or channel links
export function flatten(tree: MessageBody): string {
  return [tree].flat().map((n: MessageBodyPart) => {
    if (is<types.MessageBodyBlockquote>(n, 'blockquote')) return flatten(n.blockquote);
    if (is<types.MessageBodyBold>(n, 'bold')) return flatten(n.bold);
    if (is<types.MessageBodyBr>(n, 'br')) return '\n';
    if (is<types.MessageBodyBullet>(n, 'bullet')) return flatten(n.bullet);
    if (is<types.MessageBodyChannel>(n, 'channel')) return n.channel;
    if (is<types.MessageBodyCode>(n, 'code')) return n.code;
    if (is<types.MessageBodyCodeblock>(n, 'codeblock')) return n.codeblock;
    if (is<types.MessageBodyEmoji>(n, 'emoji')) return n.emoji;
    if (is<types.MessageBodyImg>(n, 'img')) return n._alt;
    if (is<types.MessageBodyItalic>(n, 'italic')) return flatten(n.italic);
    if (is<types.MessageBodyItem>(n, 'item')) return flatten(n.item);
    if (is<types.MessageBodyLine>(n, 'line')) return [flatten(n.line), '\n'];
    if (is<types.MessageBodyLink>(n, 'link')) return flatten(n.link);
    if (is<types.MessageBodyOrdered>(n, 'ordered')) return flatten(n.ordered);
    if (is<types.MessageBodyStrike>(n, 'strike')) return flatten(n.strike);
    if (is<types.MessageBodyText>(n, 'text')) return n.text;
    if (is<types.MessageBodyThread>(n, 'thread')) return n.thread;
    if (is<types.MessageBodyUnderline>(n, 'underline')) return flatten(n.underline);
    if (is<types.MessageBodyUser>(n, 'user')) return n.user;
     
    console.log('unknown node', n);
    return '';
  }).flat().join('');
}

const mapNodes = (dom: HTMLElement, info: SerializeInfo): MessageBody => (
  !dom.childNodes ? [] : ([...dom.childNodes] as HTMLElement[]).map((n): MessageBody => {
    if (n.nodeName === '#text') return processUrls(n.nodeValue ?? '', info);
    if (n.nodeName === 'U') return { underline: mapNodes(n, info) };
    if (n.nodeName === 'CODE') return { code: n.nodeValue ?? '' };
    if (n.nodeName === 'A') {
      console.log('link', n, { link: mapNodes(n, info), _href: n.getAttribute('href') ?? '' });
      return { link: mapNodes(n, info), _href: n.getAttribute('href') ?? '' };
    }
    if (n.nodeName === 'B') return { bold: mapNodes(n, info) };
    if (n.nodeName === 'I') return { italic: mapNodes(n, info) };
    if (n.nodeName === 'S') return { strike: mapNodes(n, info) };
    if (n.nodeName === 'DIV') return { line: mapNodes(n, info) };
    if (n.nodeName === 'UL') return { bullet: mapNodes(n, info) };
    if (n.nodeName === 'LI') return { item: mapNodes(n, info) };
    if (n.nodeName === 'IMG') return { img: n.getAttribute('src') ?? '', _alt: n.getAttribute('alt') ?? '' };
    if (n.nodeName === 'SPAN' && n.className === 'emoji') return { emoji: n.getAttribute('emoji') ?? '' };
    if (n.nodeName === 'SPAN' && n.className === 'channel') return { channel: n.getAttribute('channelId') ?? '' };
    if (n.nodeName === 'SPAN' && n.className === 'user') return processUser(n, info);
    if (n.nodeName === 'SPAN') return mapNodes(n, info);
    if (n.nodeName === 'BR') return { br: true };
     
    console.log('unknown node', n, n.nodeName);
    info.errors = info.errors || [];
    info.errors.push({
      message: 'unknown node',
      nodeAttributes: Object.keys(n.attributes)
        .reduce((acc, key) => ({
          ...acc,
          [key]: n.getAttribute(key),
        }), {}),
      nodeName: n.nodeName,
    });
    return { text: '' };
  }).flat());

function processUser(n: HTMLElement, info: SerializeInfo): types.MessageBodyUser {
  const userId = n.getAttribute('userId');
  if (!userId) {
     
    console.log('no userId', n);
    info.errors = info.errors || [];
    info.errors.push({
      message: 'no userId',
      nodeAttributes: Object.keys(n.attributes)
        .reduce((acc, key) => ({
          ...acc,
          [key]: n.getAttribute(key),
        }), {}),
      nodeName: n.nodeName,
    });
    return { user: '' };
  }
  info.mentions.push(userId);
  return { user: userId };
}

export function processUrls(text: string, info: SerializeInfo): MessageBody {
  const m = matchUrl(text);
  if (m) {
    const parts = text.split(m[0]);
    info.links.push(m[0]);
    return [
      { text: parts[0] },
      { link:[{ text: m[0] }], _href: m[0] },
      ...[processUrls(parts[1], info)].flat(),
    ];
  }
  return [{ text }];
}

// eslint-disable-next-line no-useless-escape
const matchUrl = (text: string) => text.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!,@:%_\+.~#?&\/\/=]*)/g);

const isNotEmpty = (e: MessageBodyPart): boolean => {
  if (is<types.MessageBodyText>(e, 'text')) return !(e.text === '' || e.text === '\u200B' || e.text === '\u00A0' || e.text?.trim() === '');
  if (is<types.MessageBodyBr>(e, 'br')) return false;
  return true;
};

const trim = (arr: MessageBody): MessageBody => {
  const copy = [arr].flat();
  const startIdx = copy.findIndex(isNotEmpty);
  const endIdx = copy.findLastIndex(isNotEmpty);
  return copy.slice(startIdx, endIdx + 1);
};

const isEmojiOnly = (tree: MessageBody): boolean => {
  const a: MessageBodyPart[] = [trim(tree)].flat();
  if (a.length === 1 && is<types.MessageBodyEmoji>(a[0], 'emoji')) return true;
  if (a.length === 1 && is<types.MessageBodyLine>(a[0], 'line')) {
    return isEmojiOnly(a[0].line);
  }
  return false;
};

const tempId = createCounter(`temp:${(Math.random() + 1).toString(36)}`);
