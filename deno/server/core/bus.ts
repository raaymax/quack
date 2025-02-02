import { EntityId } from "../types.ts";
import { serialize } from "./serializer.ts";

type Listeners = { [key: string]: ((...args: any[]) => void)[] };

class Emitter {
  listeners: Listeners = {};

  on = (ev: string, cb: (...args: any[]) => void) => {
    this.listeners[ev] = this.listeners[ev] ?? [];
    this.listeners[ev].push(cb);
    return () => {
      this.listeners[ev].splice(this.listeners[ev].indexOf(cb), 1);
    };
  };

  emit = (ev: string, ...args: any[]) => {
    (this.listeners[ev] ?? []).forEach((cb) => {
      try {
        cb(...serialize(args));
      } catch (e) {
        console.error(e);
      }
    });
  };

  eventNames = () => Object.keys(this.listeners);

  listenerCount = (ev: string) => this.listeners[ev]?.length ?? 0;
}

export class Bus {
  internalBus: Emitter;

  constructor() {
    this.internalBus = new Emitter();
  }

  hasKey = (userId: EntityId | string) =>
    this.internalBus.eventNames().includes(userId.toString());

  getListeners = () =>
    this.internalBus.eventNames().reduce(
      (acc, ev) => ({ ...acc, [ev]: this.internalBus.listenerCount(ev) }),
      {},
    );

  group = (userIds: (EntityId | string)[], msg: any, senderId?: EntityId) => {
    this.internalBus.emit("notif", {
      ...msg,
      _target: "group",
      _userIds: userIds.map((u) => u.toString()),
    });
    (userIds ?? []).forEach((userId) => {
      if (senderId && EntityId.from(userId).eq(senderId)) return;
      this.internalBus.emit(userId.toString(), { ...msg, _target: "group" });
    });
  };

  direct = (userId: EntityId | string, msg: any) => {
    this.internalBus.emit(userId.toString(), { ...msg, _target: "direct" });
    this.internalBus.emit("notif", {
      ...msg,
      _target: "direct",
      _userId: userId.toString(),
    });
  };

  broadcast = (msg: any) => {
    this.internalBus.emit("all", { ...msg, _target: "broadcast" });
    this.internalBus.emit("notif", { ...msg, _target: "broadcast" });
  };

  on = (userId: EntityId | string, cb: (...args: any[]) => void) => {
    const a = this.internalBus.on(userId.toString(), cb);
    const b = this.internalBus.on("all", cb);
    return () => {
      a();
      b();
    };
  };

  notif = (msg: any) =>
    this.internalBus.emit("notif", { ...msg, _target: "notif" });

  onNotif = (cb: (...args: any[]) => void) => this.internalBus.on("notif", cb);
}
