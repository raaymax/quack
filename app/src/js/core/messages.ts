/* global JsonWebKey */
import { Message } from "../types";
import type { Client } from "./client";
import { encryptor } from "./encryption";

class MRange {
  _from: number | null;
  _to: number | null;
  set from(v: number) {
    this._from = v;
  }
  set to(v: number) {
    this._to = v;
  }
  get from() {
    return this._from ?? 0;
  }
  get to() {
    return this._to ?? 64090483200000;
  }

  constructor(r: {from: number | null, to: number | null}) {
    this._from = r.from;
    this._to = r.to;
    if(this.from > this.to) {
      throw new Error('Invalid range');
    }
  }

  isOverlapping(r2: MRange) {
    const r1 = this;

    return !(r1.from >= r2.to || r1.to <= r2.from)
  }
}

class QRange extends MRange {
  containsEntirely(r: MRange) {
    return (!this._from && this._to && r.from <= this.to && r.to >= this.to)
      || (this._from && !this._to && r.from <= this.from && r.to >= this.from)
      || (this._from && this._to && r.from <= this.from && r.to >= this.to);
  }

  toString() {
    return `from: ${new Date(this.from).toISOString()},\nto  : ${new Date(this.to).toISOString()}`;
  }
}


class MsgsRes<T> extends MRange {
  data: T;
  fetched = new Date();

  constructor(res: any) {
    super(res);
    this.data= res.data;
  } 

  static sort(repo: MsgsRes<any>[]) {
    return [...repo].sort((a, b) => a.from - b.from);
  }

  toString() {
    return `data\nfrom: ${new Date(this.from).toISOString()},\nto  : ${new Date(this.to).toISOString()}`;
  }
}


class MessagesCache<T> {
  repo: MsgsRes<T>[] = []
  combineData: (r1: T, r2: T) => T;

  constructor({ combine }: { combine: (r1: T, r2: T) => T }) {
    this.combineData = combine;
    document.addEventListener('freeze', () => {
      this.repo.length = 0;
    });
  }


  update(entry: MsgsRes<T>) {
    this.repo.push(entry);
  }

  combine(r1: MsgsRes<T>, r2: MsgsRes<T>){
    return new MsgsRes({
      ...r2,
      ...r1,
      from: Math.min(r1.from, r2.from),
      to: Math.max(r1.to, r2.to),
      data: this.combineData(r1.data, r2.data),
    });
  }

  get(r: QRange) {
    const relevant: MsgsRes<T>[] = MsgsRes.sort(this.repo).filter((r2) => r.isOverlapping(r2)).reduce<any>((acc: MsgsRes<T>[], item: MsgsRes<T>) => {
      if(!acc[acc.length-1]) {
        return [item];
      }
      const rest = acc.length > 1 ? acc.slice(0, acc.length-1) : [];
      const last = acc[acc.length-1];

      if(item.isOverlapping(last)) {
        return [...rest, this.combine(last, item)]
      }
      acc.push(item);
      return acc;
    }, [])

    const cache = relevant.find((rel: MsgsRes<T>) => r.containsEntirely(rel))
    if(cache) {
      return cache.data;
    }
    return null;
  }
}


export class MessageService{
  _cache: {[key: string]: MessagesCache<Message[]>};
  pending: {[key: string]: Promise<Message[]> | undefined} = {};
  dataContainer: (r1: Message[], r2: Message[]) => Message[];
  client: Client;

  constructor(client: Client, combine?: (r1: Message[], r2: Message[]) => Message[]) {
    this._cache = {} 
    this.dataContainer = combine ?? ((r1: Message[], r2: Message[]) => [...r1, ...r2]);
    this.client = client;
  }

  cache({channelId, parentId = ''}: {channelId: string, parentId?: string}) {
    const key = `${channelId}-${parentId}`;
    if(!this._cache[key]){
      this._cache[key] = new MessagesCache({
        combine: this.dataContainer,
      });
    }
    return this._cache[key];
  }

  getMaxDate(data: Message[]) {
    const dates = data.map((m) => new Date(m.createdAt).getTime());
    return Math.max(...dates);
  }

  getMinDate(data: Message[]) {
    const dates = data.map((m) => new Date(m.createdAt).getTime());
    return Math.min(...dates);
  }

  async _fetch(query: {before?: string, after?: string, limit?: number, channelId: string, parentId?: string, encryptionKey?: JsonWebKey}) {
      const {channelId, parentId, before, after, limit, encryptionKey} = query
      const to = before ? new Date(before).getTime() : null;
      const from = after ? new Date(after).getTime() : null;
      if ( to || from ) {
        const cache = this.cache(query).get(new QRange({ from, to }));
        if(cache) {
          return cache.map(item => ({...item})) //remove clonning
        }
      }
      const {results: data, pagination} = await this.client.api.getMessages({
        channelId: channelId,
        parentId: parentId,
        before,
        after,
        limit,
      })


      if (data?.length > 0) {
        this.cache(query).update(new MsgsRes({
          from: after ? from : this.getMinDate(data),
          to: before ? to : this.getMaxDate(data),
          data: data,
        }));
      }

      if(!encryptionKey) {
        return data.map(item => ({...item}));
      }
      const enc = encryptor(encryptionKey);
      return {results: await Promise.all(data.map(async (item) => {
        if(item.encrypted) {
          try {
            return {
              ...item,
              message: await enc.decrypt(item.message),
              flat: await enc.decrypt(item.flat),
            }
          } catch(e) {
            console.error(e);
            return {...item};
          }
        }else{
          return {...item};
        }
      })), pagination }
  }

  async fetch(query: {before?: string, after?: string, limit?: number, channelId: string, parentId?: string, encryptionKey?: JsonWebKey}) {
    const key = JSON.stringify(query);
    if(this.pending[key]){
      return this.pending[key];
    }
    this.pending[key] = new Promise<Message[]>((resolve) => {
      (async () => {
        const data = await this._fetch(query);
        delete this.pending[key];
        return resolve(data);
      })();
    });
    return this.pending[key];
  }
}


/*
- add message store with owner 
- hot area for reloading
- freeze / resume events handling
- bindings to react
- ability to navigate next / prev messages
- goto specific message
- ability to pins support?

*/

