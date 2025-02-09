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
