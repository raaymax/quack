import type { Channel, Interaction, Message } from "./types.ts";

interface BaseEvent<T> {
  type: string;
  payload: T;
}

// Message
export interface MessageCreatedEvent extends BaseEvent<Message> {
  type: "message:created";
}

export interface MessageUpdatedEvent extends BaseEvent<Message> {
  type: "message:updated";
}

export interface MessageRemovedEvent extends BaseEvent<Message> {
  type: "message:removed";
}

export interface MessageInteractionEvent extends BaseEvent<Interaction> {
  type: "message:interaction";
}

// Channel
export interface ChannelCreatedEvent extends BaseEvent<Channel> {
  type: "channel:created";
}

export interface ChannelUpdatedEvent extends BaseEvent<Channel> {
  type: "channel:updated";
}

export interface ChannelUserJoinEvent extends BaseEvent<Channel> {
  type: "channel:user:join";
}

export interface ChannelUserLeftEvent extends BaseEvent<Channel> {
  type: "channel:user:left";
}

export interface ChannelRemovedEvent extends BaseEvent<Channel> {
  type: "channel:removed";
}

// User
export interface UserCreatedEvent extends BaseEvent<Message> {
  type: "user:created";
}

export interface UserUpdatedEvent extends BaseEvent<Message> {
  type: "user:updated";
}

export interface UserRemovedEvent extends BaseEvent<Message> {
  type: "user:removed";
}

// Read Receipt
export interface ReadReceiptCreatedEvent extends BaseEvent<Message> {
  type: "read_receipt:created";
}

export interface ReadReceiptUpdatedEvent extends BaseEvent<Message> {
  type: "read_receipt:updated";
}

export interface ReadReceiptRemovedEvent extends BaseEvent<Message> {
  type: "read_receipt:removed";
}

export interface SystemCloseEvent extends BaseEvent<null> {
  type: "system:close";
}

export type Event =
  | MessageCreatedEvent
  | MessageUpdatedEvent
  | MessageRemovedEvent
  | MessageInteractionEvent
  | ChannelCreatedEvent
  | ChannelUpdatedEvent
  | ChannelRemovedEvent
  | ChannelUserJoinEvent
  | ChannelUserLeftEvent
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserRemovedEvent
  | ReadReceiptCreatedEvent
  | ReadReceiptUpdatedEvent
  | ReadReceiptRemovedEvent
  | SystemCloseEvent;
