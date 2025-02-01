const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type ClassNames = string | undefined | string[] | Record<string, boolean>;

export const cn = (...classes: ClassNames[]) => classes.flat().map((item) => {
  if (typeof item === 'object' && item !== null) {
    return Object.entries(item).filter(([, value]) => Boolean(value)).map(([key]) => key);
  }
  return item;
}).flat().filter(Boolean).join(' ');

export const same = (o1: any, o2: any, fields: string[]): boolean => {
  return fields.every((field) => {
    return o1 && o2 && o1[field] === o2[field];
  });
}

export const isMobile = () => {
  if (localStorage.getItem('isMobile') === 'true') return true;
  // @ts-ignore
  return Boolean(navigator?.userAgentData?.mobile);
}

export const isToday = (date: string): boolean => {
  const someDate = new Date(date);
  const today = new Date();
  return someDate.getDate() === today.getDate()
    && someDate.getMonth() === today.getMonth()
    && someDate.getFullYear() === today.getFullYear();
};

export const formatDate = (raw?: string): string => {
  const date = raw ? new Date(raw) : new Date();
  return date.toLocaleDateString('pl-PL');
};

export const formatDateDetailed = (raw?: string): string => {
  const date = raw ? new Date(raw) : new Date();
  return `${DAYS[date.getDay()]}, ${date.toLocaleDateString('pl-PL')}`;
};

export const formatTime = (raw?: string): string => {
  const date = raw ? new Date(raw) : new Date();
  let minutes = date.getMinutes().toString();
  if (minutes.length === 1) minutes = `0${minutes}`;
  return `${date.getHours()}:${minutes}`;
};

export const createCounter = (prefix: string): (() => string) => {
  let counter = 0;
  return () => `${prefix}:${counter++}`;
};

type NotifierHandler<T> = (data: T) => void;

type Notifier<T> = [
  NotifierHandler<T>,
  (handler: NotifierHandler<T>) => void
];

export const createNotifier = <T>(): Notifier<T> => {
  const listeners: ((data: T) => void)[] = [];
  let cooldown: ReturnType<typeof setTimeout> | null = null;

  const notify = (data: T) => {
    if (cooldown) clearTimeout(cooldown);
    cooldown = setTimeout(() => listeners.forEach((l) => l(data)), 10);
  };
  const watch = (handler: NotifierHandler<T>) => {
    listeners.push(handler);
    return () => listeners.splice(listeners.indexOf(handler), 1);
  };

  return [notify, watch];
};

export const createCooldown = (fn: () => void, time: number) => {
  let cooldown = false;
  return async () => {
    if (!cooldown) {
      cooldown = true;
      setTimeout(() => { cooldown = false; }, time);
      return fn();
    }
  };
};

type EventListener = (...args: unknown[]) => Promise<unknown>;

export const createEventListener = () => {
  const handlers: Record<string, EventListener[]> = {};
  const notify = (ev: string, ...args: unknown[]) => {
    if (!handlers[ev] || handlers[ev].length === 0) {
       
      console.log('Event not handled', ev, args);
    }
    return Promise.all(
      (handlers[ev] || [])
        .map(async (listener: EventListener) => {
          try {
            await listener(...args);
          } catch (err) {
             
            console.error(err);
          }
        }),
    );
  };

  const watch = (ev: string, fn: EventListener) => {
    (handlers[ev] = handlers[ev] || []).push(fn);
  };
  const once = (ev: string, fn: EventListener) => {
    handlers[ev] = handlers[ev] || [];
    const cb = async (...args: unknown[]) => {
      const idx = handlers[ev].findIndex((c) => c === cb);
      handlers[ev].splice(idx, 1);
      return fn(...args);
    };
    handlers[ev].push(cb);
  };

  const exists = (ev: string) => Array.isArray(handlers[ev]) && handlers[ev].length > 0;

  return {
    watch, once, notify, exists,
  };
};

export const buildEmojiNode = (
  result: {unicode?: string, fileId?: string, shortname: string},
  getUrl: (fileId: string) => string,
) => {
  const emoji = ((): Node => {
    if (result.unicode) {
      return document.createTextNode(String.fromCodePoint(parseInt(result.unicode, 16)));
    }
    if (result.fileId) {
      const img = document.createElement('img');
      img.src = getUrl(result.fileId);
      img.alt = result.shortname;
      return img;
    }
    return document.createTextNode(result.shortname);
  })();
  const node = document.createElement('span');
  node.className = 'emoji';
  node.setAttribute('emoji', result.shortname);
  node.setAttribute('contentEditable', 'false');
  node.appendChild(emoji);
  return node;
};

export type WithoutUndefined<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K]
};
export const omitUndefined = <T extends {[key: string]: unknown | undefined | null}>(
  ob: T,
): WithoutUndefined<T> => Object.fromEntries(
  Object.entries(ob).filter(([, v]) => v !== undefined),
) as WithoutUndefined<T>;
