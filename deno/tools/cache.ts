import { mergeRanges, Range } from './range.ts';

export class CacheEntry<T extends any[]> extends Range {
  data: T;
  timestamp: number;

  constructor(from: number, to: number, data: T) {
    super(from, to);
    this.data = data;
    this.timestamp = new Date().getTime();
  }

  static sort(repo: CacheEntry<any>[]) {
    return [...repo].sort((a, b) => a.from - b.from);
  }

  override toString() {
    return `${super.toString()}: [${this.data}]`;
  }
}

export type CacheQuery = { 
  from?: number;
  to?: number;
}

export class Cache<T extends any[]> {
  repo: CacheEntry<T>[] = [];

  merge = (a: CacheEntry<T>, b: CacheEntry<T>): CacheEntry<T> => (
    new CacheEntry(Math.min(a.from, b.from), Math.max(a.to, b.to), [...a.data, ...b.data]) as CacheEntry<T>
  )

  constructor(...entries: CacheEntry<T>[]) {
    this.repo = entries;
  }

  cleanup() {
    this.repo = this.repo.filter((entry) => entry.timestamp > new Date().getTime() - 1000 * 60 * 60);
  }

  invalidate = () => {
    this.repo.length = 0;
  }

  addEntry(entry: CacheEntry<T>) {
    this.repo.push(entry);
    this.repo = this.repo.sort((a, b) => a.from - b.from);
  }

  get(q: CacheQuery): CacheEntry<T> | null{
    const repo = mergeRanges(this.merge, ...this.repo);
    if("from" in q && "to" in q && q.from !== undefined && q.to !== undefined){
      const {from, to} = q;
      return repo.find((entry) => entry.containsEntirely(new Range(from, to))) || null;
    }
    if("from" in q && q.from !== undefined){
      const { from } = q;
      return repo.find((entry) => entry.containsPointFrom(from)) || null;
    }
    if("to" in q && q.to !== undefined){
      const { to } = q;
      return repo.find((entry) => entry.containsPointTo(to)) || null;
    }
    return null;
  }
}
