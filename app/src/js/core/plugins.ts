import { client } from "./client.ts";

declare global {
  interface Window {
    Chat: typeof plugins;
  }
}

const registry: Record<string, Array<unknown>> = {};
const plugins = {
  register: (slot: string, data: unknown) => {
    if (typeof data === "function") {
      data = data(client);
    }
    registry[slot] = registry[slot] || [];
    [data].flat().forEach((d) => registry[slot].push(d));
  },

  get: (slot: string): unknown[] => registry[slot] || [],
};

window.Chat = plugins;

export default plugins;
