import type { Req } from "@planigale/planigale";

export type TrustProxy = boolean | number | string[];

type Matcher = (address: string, hop: number) => boolean;

const PRESETS: Record<string, string[]> = {
  loopback: ["127.0.0.0/8", "::1/128"],
  linklocal: ["169.254.0.0/16", "fe80::/10"],
  uniquelocal: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "fc00::/7"],
};

const normalize = (address: string): string => {
  const value = address.trim().replace(/^\[|\]$/g, "").toLowerCase();
  if (value === "localhost") return "127.0.0.1";
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? mapped[1] : value;
};

const ipv4ToBits = (address: string): bigint | null => {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  let bits = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null;
    bits = (bits << 8n) | BigInt(part);
  }
  return bits;
};

const ipv6ToBits = (address: string): bigint | null => {
  if (!address.includes(":")) return null;
  const [head, tail, ...rest] = address.split("::");
  if (rest.length) return null;
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const missing = 8 - left.length - right.length;
  if (tail === undefined ? missing !== 0 : missing < 1) return null;
  const groups = [...left, ...Array(Math.max(missing, 0)).fill("0"), ...right];
  let bits = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    bits = (bits << 16n) | BigInt(parseInt(group, 16));
  }
  return bits;
};

const parse = (address: string) => {
  const v4 = ipv4ToBits(address);
  if (v4 !== null) return { bits: v4, size: 32 };
  const v6 = ipv6ToBits(address);
  if (v6 !== null) return { bits: v6, size: 128 };
  return null;
};

const rangeMatcher = (range: string): Matcher => {
  const [base, prefix] = range.split("/");
  const network = parse(normalize(base));
  if (!network) throw new Error(`Invalid trustProxy address: ${range}`);
  const length = prefix === undefined ? network.size : Number(prefix);
  const shift = BigInt(network.size - length);
  return (address) => {
    const ip = parse(address);
    return !!ip && ip.size === network.size &&
      ip.bits >> shift === network.bits >> shift;
  };
};

export const trustMatcher = (trust: TrustProxy): Matcher => {
  if (typeof trust === "boolean") return () => trust;
  if (typeof trust === "number") return (_address, hop) => hop < trust;
  const entries = trust.flatMap((entry) => PRESETS[entry] ?? [entry]);
  const matchers = entries.map(rangeMatcher);
  return (address, hop) => matchers.some((match) => match(address, hop));
};

export const resolveClientIp = (
  peer: string,
  forwardedFor: string | undefined,
  isTrusted: Matcher,
): string => {
  const chain = [
    normalize(peer),
    ...(forwardedFor ?? "").split(",").map(normalize).filter(Boolean)
      .reverse(),
  ];
  for (let hop = 0; hop < chain.length - 1; hop++) {
    if (!isTrusted(chain[hop], hop)) return chain[hop];
  }
  return chain[chain.length - 1];
};

export const clientIp = (req: Req, isTrusted: Matcher): string =>
  resolveClientIp(
    req.ip.hostname,
    req.headers["x-forwarded-for"],
    isTrusted,
  );
