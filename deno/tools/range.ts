export class Range {
  from: number;
  to: number;

  constructor(from: number, to: number) {
    this.from = from < to ? from : to;
    this.to = to > from ? to : from;
  }

  containsEntirely(r: Range): boolean {
    return this.from <= r.from && r.to <= this.to;
  }

  containsPoint(p: number): boolean {
    return this.from <= p && p <= this.to;
  }

  containsPointFrom(p: number): boolean {
    return this.from <= p && p < this.to;
  }

  containsPointTo(p: number): boolean {
    return this.from < p && p <= this.to;
  }

  overlaps(r: Range): boolean {
    return this.from <= r.to && r.from <= this.to;
  }

  equal(r: Range): boolean {
    return this.from === r.from && this.to === r.to;
  }

  toString(): string {
    const from = this.from.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "_");
    const to = this.to.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "_");
    return `[${from}, ${to}]`;
  }
}



const merge = (a: Range, b: Range): Range => (
  new Range(Math.min(a.from, b.from), Math.max(a.to, b.to))
)

export const mergeRanges = <T extends Range>(merge:((a: T, b:T) => T), ...a: T[]): T[] => {
  const sorted = a.sort((a, b) => a.from - b.from);
  return sorted.reduce((acc: T[], range: T) => {
    if (!acc[acc.length - 1]) {
      return [range];
    }
    const rest = acc.length > 1 ? acc.slice(0, acc.length - 1) : [];
    const last = acc[acc.length - 1];

    if( last.overlaps(range) ) {
      return [...rest, merge(last, range)];
    }

    return [...acc, range];
  }, []);
}
