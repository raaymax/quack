import { flow, makeAutoObservable } from "mobx";
import {
  DateTime,
  Eid,
  FullMessage,
  MessageBody,
  MessageFile,
  ViewMessage,
  ViewProgress,
} from "../../types.ts";
import { client } from "../client.ts";
import type { MessagesModel } from "./messages.ts";

type ViewAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  size?: number;
  url: string;
};

function toAttachments(
  value: {
    attachments?: Array<{ id: string; fileName: string; contentType: string }>;
    files?: MessageFile[];
  },
): ViewAttachment[] {
  const legacy = (value.attachments ?? []).map((a) => ({
    id: a.id,
    fileName: a.fileName,
    contentType: a.contentType,
    url: client.api.getUrl(a.id),
  }));
  const resolved = (value.files ?? [])
    .filter((f) => f.status !== "deleted")
    .map((f) => ({
      id: f.id,
      fileName: f.fileName,
      contentType: f.contentType,
      size: f.size ?? undefined,
      url: client.api.getFileUrl(f.channelId, f.id),
    }));
  return [...legacy, ...resolved];
}

export class MessageModel implements ViewMessage {
  secured = false as const;
  id: Eid;
  channelId: Eid;
  userId: Eid;
  parentId: Eid | null;
  pinned: boolean;
  clientId: string;
  appId?: string;
  ephemeral?: boolean;
  reactions: Array<{
    userId: Eid;
    reaction: string;
  }>;

  updatedAt: DateTime;
  createdAt: DateTime;
  flat: string;
  message: MessageBody;
  annotations?: MessageBody;
  emojiOnly?: boolean;
  thread?: Array<{
    userId: Eid;
    childId: Eid;
  }>;
  links?: string[];
  mentions?: string[];
  linkPreviews?: {
    url: string;
    title: string;
    siteName: string;
    description: string;
    mediaType: string;
    contentType: string;
    images: string[];
    videos: string[];
    favicons: string[];
    charset: string;
  }[];
  parsingErrors?: Array<{ message: string; nodeAttributes?: Record<string, string | null>; nodeName?: string }>;
  attachments?: Array<{
    id: string;
    fileName: string;
    contentType: string;
    size?: number;
    url: string;
  }>;
  fileIds?: Eid[];

  progress?: ViewProgress[];
  info?: {
    type: "error" | "info";
    msg: string;
    action?: string;
  } | null;
  editing: boolean = false;
  parent: MessagesModel;
  ghost?: boolean;

  static makeGhost(value: Partial<ViewMessage>, parent: MessagesModel) {
    const ghost = new MessageModel(value, parent);
    ghost.ghost = true;
    return ghost;
  }

  static from = (value: Partial<FullMessage>, parent: MessagesModel) => {
    return new MessageModel({
      secured: false,
      id: value.id ?? "",
      channelId: value.channelId ?? "",
      userId: value.userId ?? "",
      parentId: value.parentId ?? null,
      pinned: value.pinned ?? false,
      clientId: value.clientId ?? "",
      appId: value.appId ?? "",
      ephemeral: value.ephemeral ?? false,
      reactions: value.reactions ?? [],
      updatedAt: value.updatedAt ?? "",
      createdAt: value.createdAt ?? "",
      flat: value.flat ?? "",
      message: value.message ?? [],
      annotations: value.annotations ?? [],
      emojiOnly: value.emojiOnly ?? false,
      thread: value.thread ?? [],
      links: value.links ?? [],
      mentions: value.mentions ?? [],
      linkPreviews: value.linkPreviews ?? [],
      parsingErrors: value.parsingErrors ?? [],
      attachments: value.attachments ?? [],
      fileIds: value.fileIds ?? [],
      files: value.files ?? [],
      info: value.info ?? null,
    }, parent);
  };

  constructor(value: FullMessage, parent: MessagesModel) {
    makeAutoObservable(this, { parent: false });
    this.id = value.id;
    this.channelId = value.channelId;
    this.userId = value.userId;
    this.parentId = value.parentId;
    this.pinned = value.pinned;
    this.clientId = value.clientId;
    this.appId = value.appId;
    this.ephemeral = value.ephemeral;
    this.reactions = value.reactions ?? [];
    this.updatedAt = value.updatedAt;
    this.createdAt = value.createdAt;
    this.flat = value.flat;
    this.message = value.message;
    this.annotations = value.annotations;
    this.emojiOnly = value.emojiOnly;
    this.thread = value.thread;
    this.links = value.links;
    this.mentions = value.mentions;
    this.linkPreviews = value.linkPreviews;
    this.parsingErrors = value.parsingErrors;
    this.fileIds = value.fileIds;
    this.attachments = toAttachments(value);

    this.parent = parent;
  }

  get root() {
    return this.parent.root;
  }

  async dispose() {
    this.id = "";
    this.channelId = "";
    this.userId = "";
    this.parentId = null;
    this.pinned = false;
    this.clientId = "";
    this.appId = "";
    this.ephemeral = false;
    this.reactions = [];
    this.updatedAt = "";
    this.createdAt = "";
    this.flat = "";
    this.message = [];
    this.annotations = [];
    this.emojiOnly = false;
    this.thread = [];
    this.links = [];
    this.mentions = [];
    this.linkPreviews = [];
    this.parsingErrors = [];
    this.attachments = [];
    this.fileIds = [];
    this.progress = [];
    this.info = undefined;
    this.editing = false;
  }

  patch = (value: Partial<ViewMessage>) => {
    if (value.id !== undefined) this.id = value.id;
    if (value.pinned !== undefined) this.pinned = value.pinned;
    if (value.reactions !== undefined) this.reactions = value.reactions;
    if (value.updatedAt !== undefined) this.updatedAt = value.updatedAt;
    if (value.message !== undefined) this.message = value.message;
    if (value.flat !== undefined) this.flat = value.flat;
    if (value.annotations !== undefined) this.annotations = value.annotations;
    if (value.emojiOnly !== undefined) this.emojiOnly = value.emojiOnly;
    if (value.thread !== undefined) this.thread = value.thread;
    if (value.links !== undefined) this.links = value.links;
    if (value.mentions !== undefined) this.mentions = value.mentions;
    if (value.linkPreviews !== undefined) {
      this.linkPreviews = value.linkPreviews;
    }
    if (value.parsingErrors !== undefined) {
      this.parsingErrors = value.parsingErrors;
    }
    if (value.info !== undefined) this.info = value.info;
    if (value.editing !== undefined) this.editing = value.editing;
    if (value.fileIds !== undefined) this.fileIds = value.fileIds;

    if (value.attachments !== undefined || value.files !== undefined) {
      this.attachments = toAttachments(value);
    }
    return this;
  };

  get user() {
    if (!this.root) throw new Error("Root not set");
    return this.root.users.get(this.userId);
  }

  get isMine() {
    if (!this.root) throw new Error("Root not set");
    return this.userId === this.root.userId;
  }

  async remove() {
    if (!this.root) throw new Error("Root not set");
    await this.root.getMessages(this.channelId, this.parentId)?.remove(this.id);
  }

  addReaction = flow(function* (this: MessageModel, reaction: string) {
    if (!this.root) throw new Error("Root not set");
    const userId = this.root.userId;
    const idx = this.reactions.findIndex((r) =>
      r.userId === userId && r.reaction === reaction
    );
    if (idx !== -1) {
      this.reactions.splice(idx, 1);
      this.reactions = [...this.reactions];
    } else {
      this.reactions = [...this.reactions, {
        userId: this.root.userId,
        reaction,
      }];
    }
    yield client.api.addReaction(this.id, reaction);
  });

  pin = flow(function* (this: MessageModel) {
    yield client.api.pinMessage(this.id, true);
    this.pinned = true;
  });

  unpin = flow(function* (this: MessageModel) {
    yield client.api.pinMessage(this.id, false);
    this.pinned = false;
  });

  closeEditing = () => {
    this.editing = false;
  };

  toJSON(): FullMessage {
    return {
      secured: false,
      id: this.id,
      channelId: this.channelId,
      userId: this.userId,
      parentId: this.parentId,
      clientId: this.clientId,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
      pinned: this.pinned,
      reactions: this.reactions,
      flat: this.flat,
      message: this.message,
      fileIds: this.fileIds,
    };
  }
}
