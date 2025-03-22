/* global JsonWebKey */
import { Message, FullMessage } from "../types.ts";
import type { Client } from "./client.ts";
import { CacheEntry, Cache, mergeFn } from "@quack/tools";

class MsgsCacheEntry extends CacheEntry<FullMessage[]>{}

class MessagesCache extends Cache<FullMessage[]> {
  override merge = (a: CacheEntry<FullMessage[]>, b: CacheEntry<FullMessage[]>): CacheEntry<FullMessage[]> => (
    new CacheEntry(Math.min(a.from, b.from), Math.max(a.to, b.to), mergeFn(
      (_: FullMessage, b: FullMessage) => b,
      (a: FullMessage) => a.id.toString(),
      a.data,
      b.data
    )) as CacheEntry<FullMessage[]>
  )


  update(messages: FullMessage[]) {
    const dates = messages.map((m) => new Date(m.createdAt).getTime());
    const from = Math.min(...dates);
    const to = Math.max(...dates);
    const entry = new MsgsCacheEntry(from, to, messages);
    this.repo.push(entry);
  }
}

type MessageQuery = {
  pinned?: boolean;
  before?: string;
  after?: string;
  limit?: number;
  channelId: string;
  parentId?: string | null;
  search?: string;
  preprocess?: (m: Message[]) => Promise<Message[]>;
};

export class MessageService {
  _cache: { [key: string]: MessagesCache };
  pending: { [key: string]: Promise<Message[]> } = {};
  dataContainer: (r1: Message[], r2: Message[]) => Message[];
  client: Client;

  constructor(
    client: Client,
    combine?: (r1: Message[], r2: Message[]) => Message[],
  ) {
    this._cache = {};
    this.dataContainer = combine ??
      ((r1: Message[], r2: Message[]) => [...r1, ...r2]);
    this.client = client;
  }

  cache({ channelId, parentId = "", pinned, search }: MessageQuery) {
    let key = `${channelId}-${parentId}`;
    if (pinned) key += "-pinned";
    if (search) key += `-search:${search}`;
    if (!this._cache[key]) {
      this._cache[key] = new MessagesCache();
    }
    return this._cache[key];
  }

  async _fetch(query: MessageQuery): Promise<Message[]> {
    const { channelId, parentId, before, after, limit, preprocess } = query;
    const to = before ? new Date(before).getTime() : undefined;
    const from = after ? new Date(after).getTime() : undefined;
    if (to || from) {
      console.log(from, to);
      const cache = this.cache(query).get({from, to});
      if (cache) {
        console.log('using cache')
        return cache.data.map((item) => ({ ...item })); //remove clonning
      }
    }
    const data = await this.client.api.getMessages({
      pinned: query.pinned,
      channelId: channelId,
      parentId: parentId,
      q: query.search,
      before,
      after,
      limit,
    });

    const preprocessedData = preprocess ? await preprocess(data) : data;

    if (data?.length > 0) {
      this.cache(query).update(preprocessedData);
    }

    return preprocessedData;
  }

  async fetch(query: MessageQuery): Promise<Message[]> {
    const key = JSON.stringify(query);
    const promise = this.pending[key];
    if (promise) {
      return await promise;
    }
    this.pending[key] = new Promise<Message[]>((resolve, reject) => {
      (async () => {
        try {
          const data = await this._fetch(query);
          const ret = resolve(data);
          delete this.pending[key];
          return ret;
        } catch (e) {
          console.error(e);
          reject(e);
        } finally {
          delete this.pending[key];
        }
      })();
    });
    return await this.pending[key];
  }
}
