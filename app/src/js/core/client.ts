import Api from "@quack/api";
import { MessageService } from "./messages.ts";

export class Client {
  _api: Api | null = null;
  messages: MessageService;

  get api(): Api {
    if (!this._api) {
      this._api = new Api(API_URL, {
        fetch: fetch.bind(window),
        bufferedUpload: BUFFERED_UPLOAD,
      });
    }
    return this._api;
  }

  constructor() {
    this.messages = new MessageService(this);
  }

  req(...args: Parameters<Api["req"]>) {
    return this.api.req(...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(name: string, cb: (e: any) => void) {
    this.api.on(name, (ev: Event) => {
      if (ev instanceof CustomEvent) {
        cb(ev.detail);
      } else {
        console.warn("Event is not CustomEvent", ev);
        cb(ev);
      }
    });
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on2(name: string, cb: (e: any) => void) {
    const handler = (ev: Event) => {
      if (ev instanceof CustomEvent) {
        cb(ev.detail);
      } else {
        console.warn("Event is not CustomEvent", ev);
        cb(ev);
      }
    };
    this.api.on(name, handler);
    return () => this.api.off(name, handler);
  }

  emit(type: string, data: unknown) {
    return this.api.emit(new CustomEvent(type, { detail: data }));
  }
}

export const client = new Client();
export * from "@quack/api";

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    client.emit("win.visible", {});
  }
});
