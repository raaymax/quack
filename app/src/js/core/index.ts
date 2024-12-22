import Api from './api.ts';
import {MessageService} from './messages.ts';

declare global {
  const API_URL: string;
}

export class Client {
  _api: Api;
  messages: MessageService;

  get api() {
    if (!this._api) {
      this._api = new Api(API_URL);
    }
    return this._api;
  }

  constructor() {
    this.messages = new MessageService(this);
  }

  req(...args: any[]) {
    return this.api.req(...args);
  }

  on(name: string, cb: (e: any) => void) {
    this.api.on(name, (ev: CustomEvent) => cb(ev.detail));
    return this;
  }

  emit(type: string, data: any) {
    return this.api.emit(new CustomEvent(type, { detail: data }));
  }
}

export const client = new Client();
export * from './api.ts';

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    client.emit('win.visible', {});
  }
});


