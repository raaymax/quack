import type { Req } from "@planigale/planigale";

export const trustedHops = (value: unknown = 0): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(
      `trustProxy must be the number of proxies in front of the server, got ${
        JSON.stringify(value)
      }`,
    );
  }
  return value;
};

export const resolveClientIp = (
  peer: string,
  forwardedFor: string | undefined,
  hops: number,
): string => {
  const chain = [
    peer,
    ...(forwardedFor ?? "").split(",").map((address) => address.trim())
      .filter(Boolean).reverse(),
  ];
  return chain[Math.min(hops, chain.length - 1)];
};

export const clientIp = (req: Req, hops: number): string =>
  resolveClientIp(req.ip.hostname, req.headers["x-forwarded-for"], hops);
