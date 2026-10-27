const isNumber = (value: string): boolean => {
  return !isNaN(Number(value));
};

export const parse = (
  input: string,
  { parseNumbers }: { parseNumbers?: boolean } = {},
): Record<string, unknown> => {
  const str = input
    .replace(/^\?/, "")
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]");
  const args = str.split("&");
  const params: Record<string, unknown> = {};

  for (const arg of args) {
    const [key, value] = arg.split("=");
    const keys = key.split("[");
    let obj = params;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i].replace(/\]/g, "");
      if (i === keys.length - 1) {
        const v = decodeURIComponent(value);
        if (parseNumbers && isNumber(v)) {
          obj[k] = parseInt(v, 10);
        } else {
          obj[k] = v;
        }
      } else {
        obj[k] = obj[k] || {};
        obj = obj[k] as Record<string, unknown>;
      }
    }
  }

  return params;
};

const stringifyObject = (key: string, obj: object): string => {
  if (!obj) return "";
  const keys = Object.keys(obj);
  const args = keys.map((k) => {
    const child = obj[k as keyof typeof obj];
    if (typeof child === "object" && !Array.isArray(child) && child !== null) {
      return stringifyObject(`${key}[${k}]`, child);
    } else {
      return `${key}[${k}]=${encodeURIComponent(child)}`;
    }
  });

  return args.join("&");
};

export const stringify = (params: object): string => {
  if (!params) return "";
  const keys = Object.keys(params);
  const args = keys.map((key) => {
    const child = params[key as keyof typeof params];
    if (typeof child === "object") {
      return stringifyObject(key, child);
    } else {
      return `${key}=${encodeURIComponent(child)}`;
    }
  });

  return args.join("&");
};
