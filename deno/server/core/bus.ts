import { EntityId } from "../types.ts";
import { serialize } from "./serializer.ts";

type BusMessage = Record<string, unknown>;
type BusCallback = (msg: BusMessage) => void;
type Listeners = { [key: string]: BusCallback[] };

class Emitter {
  listeners: Listeners = {};

  on = (ev: string, cb: BusCallback) => {
    this.listeners[ev] = this.listeners[ev] ?? [];
    this.listeners[ev].push(cb);
    return () => {
      this.listeners[ev].splice(this.listeners[ev].indexOf(cb), 1);
    };
  };

  emit = (ev: string, msg: BusMessage) => {
    (this.listeners[ev] ?? []).forEach((cb) => {
      try {
        cb(serialize(msg));
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

  group = (
    userIds: (EntityId | string)[],
    msg: BusMessage,
    senderId?: EntityId,
  ) => {
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

  direct = (userId: EntityId | string, msg: BusMessage) => {
    this.internalBus.emit(userId.toString(), { ...msg, _target: "direct" });
    this.internalBus.emit("notif", {
      ...msg,
      _target: "direct",
      _userId: userId.toString(),
    });
  };

  broadcast = (msg: BusMessage) => {
    this.internalBus.emit("all", { ...msg, _target: "broadcast" });
    this.internalBus.emit("notif", { ...msg, _target: "broadcast" });
  };

  on = (userId: EntityId | string, cb: BusCallback) => {
    const a = this.internalBus.on(userId.toString(), cb);
    const b = this.internalBus.on("all", cb);
    return () => {
      a();
      b();
    };
  };

  notif = (msg: BusMessage) =>
    this.internalBus.emit("notif", { ...msg, _target: "notif" });

  onNotif = (cb: BusCallback) => this.internalBus.on("notif", cb);
}
