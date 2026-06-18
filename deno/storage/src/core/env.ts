export const envInt = (name: string, fallback: number): number => {
  let raw: string | undefined;
  try {
    raw = Deno.env.get(name);
  } catch {
    return fallback;
  }
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (Number.isInteger(value) && value > 0) return value;
  console.warn(`[storage] invalid ${name}="${raw}", using ${fallback}`);
  return fallback;
};
