import type { AppModel } from "./app"
import { flow, makeAutoObservable } from "mobx"
import { DateTime, Eid, FullMessage, MessageBody, ViewMessage, ViewProgress } from "../../types"
import { getUrl } from "../../services/file";
import { client } from "../client";

export class MessageModel implements ViewMessage {
    secured: false = false;
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
    parsingErrors?: any[];
    attachments?: Array<{
      id: string;
      fileName: string;
      contentType: string;
      url: string;
    }>;

    progress?: ViewProgress[];
    info?: {
      type: 'error' | 'info',
      msg: string,
      action?: string,
    };
    editing: boolean = false;
    root: AppModel;

    constructor(value: FullMessage, root: AppModel) {
      makeAutoObservable(this, {root: false});
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
      this.attachments = value.attachments?.map((attachment) => {
        return {
          id: attachment.id,
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          url: getUrl(attachment.id),
        }
      });

      this.root = root;
    }

    patch = (value: FullMessage) => {
      this.pinned = value.pinned;
      this.reactions = value.reactions ?? [];
      this.updatedAt = value.updatedAt;
      this.message = value.message;
      this.annotations = value.annotations;
      this.emojiOnly = value.emojiOnly;
      this.thread = value.thread;
      this.links = value.links;
      this.mentions = value.mentions;
      this.linkPreviews = value.linkPreviews;
      this.parsingErrors = value.parsingErrors;
      this.attachments = value.attachments?.map((attachment) => {
        return {
          id: attachment.id,
          fileName: attachment.fileName,
          contentType: attachment.contentType,
          url: getUrl(attachment.id),
        }
      });
      return this;
    }

    get user() {
      return this.root.users.get(this.userId);
    }

    get isMine() {
      return this.userId === this.root.userId;
    }

    async remove() {
      await this.root.getMessages(this.channelId, this.parentId).remove(this.id);
    }

    addReaction = flow(function*(this: MessageModel, reaction: string) {
      const idx = this.reactions.findIndex((r) => r.userId === this.root.userId && r.reaction === reaction);
      if(idx !== -1) {
        this.reactions.splice(idx, 1);
        this.reactions = [...this.reactions];
      } else {
        this.reactions = [...this.reactions, {
          userId: this.root.userId,
          reaction,
        }];
      }
      yield client.api.addReaction(this.id, reaction);
    })


    pin = flow(function*(this: MessageModel) {
      yield client.api.pinMessage(this.id, true);
      this.pinned = true;
    })
    
    unpin = flow(function*(this: MessageModel) {
      yield client.api.pinMessage(this.id, false);
      this.pinned = false;
    })

    closeEditing = () => {
      this.editing = false;
    }
}
