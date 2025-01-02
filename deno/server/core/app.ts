import { EntityId, MessageBody } from "../types.ts";
import type { Core } from "./core.ts";
import { flatten } from "./message/flatten.ts";

type EphemeralMessageInit = {
  channelId: EntityId;
  parentId?: EntityId;
  flat?: string;
  message?: MessageBody;
};

class App {
  constructor(public appId: string, public core: Core) {}

  sendEphemeral(userId: EntityId, message: EphemeralMessageInit) {
    if (!message.flat && !message.message) {
      throw new Error("Invalid message - missing flat of message field");
    }
    if (!message.flat && message.message) {
      message.flat = flatten(message.message);
    }
    if (!message.message && message.flat) {
      message.message = [{ line: { text: message.flat } }];
    }

    this.core.bus.direct(userId, {
      type: "message",
      id: `ephemeral:${Math.random().toString(10)}`,
      appId,
      ephemeral: true,
      channelId: message.channelId,
      parentId: message.parentId,
      flat: message.flat,
      message: message.message,
      createdAt: new Date().toISOString(),
    });
  }
}
