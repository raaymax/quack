type KeyFn<T> = (item: T) => string;

const apply = <T>(keyFn: KeyFn<T>, obj: { [id: string]: T }, item: T) => {
  obj[keyFn(item)] = item;
  return obj;
};

const byId = <T>(keyFn: KeyFn<T>, ...a: T[][]): { [id: string]: T } => {
  const out: { [id: string]: T } = {};
  return a.reduce((acc1, arr) => (
    arr.reduce((acc, item) => (
      apply(keyFn, acc, item)
    ), acc1)
  ), out);
};

export const merge = <T>(keyFn: KeyFn<T>, ...a: T[][]): T[] => {
  const map = byId(keyFn, ...a);
  return Object.values(map);
};

const mergeById = <T>(
  merge: (a: T, b: T) => T,
  keyFn: KeyFn<T>,
  ...a: T[][]
): { [id: string]: T } => {
  const out: { [id: string]: T } = {};
  return a.reduce((acc1, arr) => (
    arr.reduce((acc, item) => {
      if (acc[keyFn(item)]) {
        acc[keyFn(item)] = merge(acc[keyFn(item)], item);
      } else {
        acc[keyFn(item)] = item;
      }
      return acc;
    }, acc1)
  ), out);
};
export const mergeFn = <T>(
  merge: (a: T, b: T) => T,
  keyFn: KeyFn<T>,
  ...a: T[][]
): T[] => {
  const map = mergeById(merge, keyFn, ...a);
  return Object.values(map);
};
