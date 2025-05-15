import { client } from "./client.ts";

declare global {
  interface Window {
    Chat: any;
  }
}

const registry: Record<string, Array<any>> = {};
const plugins = {
  register: (slot: string, data: any) => {
    if (typeof data === "function") {
      data = data(client);
    }
    registry[slot] = registry[slot] || [];
    [data].flat().forEach((d) => registry[slot].push(d));
  },

  get: (slot: string): any => registry[slot] || [],
};

window.Chat = plugins;

export default plugins;
