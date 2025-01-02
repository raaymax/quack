import Api from '@quack/api';
import {MessageService} from './messages.ts';

declare global {
  const API_URL: string;
}

export class Client {
  _api: Api | null = null;
  _http: Promise<any> | null = null;
  messages: MessageService;

  getFetch(): typeof fetch {
    return async (...args: Parameters<typeof fetch>): ReturnType<typeof fetch> => {
      if(window.isTauri) {
        if(!this._http){
          this._http = import('@tauri-apps/plugin-http');
        }
        return await (await this._http).fetch(...args);
      }
      return await fetch(...args);
    }
  }

  get api(): Api {
    if (!this._api) {
      this._api = new Api(API_URL, { fetch: this.getFetch() });
    }
    return this._api;
  }

  constructor() {
    this.messages = new MessageService(this);
  }

  req(...args: Parameters<Api['req']>) {
    return this.api.req(...args);
  }

  on(name: string, cb: (e: any) => void) {
    this.api.on(name, (ev: Event) => {
      if(ev instanceof CustomEvent){
        cb(ev.detail)
      } else {
        console.warn("Event is not CustomEvent", ev);
        cb(ev);
      }
    });
    return this;
  }

  emit(type: string, data: any) {
    return this.api.emit(new CustomEvent(type, { detail: data }));
  }
}

export const client = new Client();
export * from '@quack/api';

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    client.emit('win.visible', {});
  }
});


