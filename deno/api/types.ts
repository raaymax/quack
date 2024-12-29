/* global Deno */

export class EntityId {
  constructor(public value: string) {}

  static fromArray(id: string | EntityId | string[] | EntityId[]): EntityId[] {
    return [id].flat().map(EntityId.from);
  }

  static from(id: string | EntityId): EntityId {
    if (id instanceof EntityId) {
      return new EntityId(id.toString());
    }
    if (typeof id === "string") {
      return new EntityId(id);
    }
    console.log(id);
    throw new Error("Invalid id type");
  }

  static unique(ids: EntityId[]) {
    return EntityId.fromArray([...new Set(ids.map((id) => id.value))]);
  }

  eq(id: EntityId) {
    return this.value === id.value;
  }

  neq(id: EntityId) {
    return this.value !== id.value;
  }

  toString() {
    return this.value;
  }
}

export type Eid = "Deno" extends keyof typeof globalThis ? EntityId : string;

export type EncryptedData = {
  encrypted: string;
  _iv: string;
};

export type Channel = {
  id: string;
  name: string;
  users: string[];
  channelType: string;
  priv?: boolean;
  direct?: boolean;
  private?: boolean;
  encryptionKey?: JsonWebKey | null;
};

export type UserConfig = {
  appVersion: string;
  mainChannelId: string;
  encryptionKey: JsonWebKey;
  channels: {
    channelId: string;
    encryptionKey: JsonWebKey;
  };
};

export type User = {
  id: string;
  alias: string | null;
  email: string;
  name: string;
  avatarFileId: string;
  status?: "active" | "inactive" | "away";
  publicKey: JsonWebKey;
  hidden?: boolean;
};

export type UserSession = {
  status: "ok";
  token: string;
  userId: string;
  publicKey: JsonWebKey;
  secrets: EncryptedData;
  key: string;
};

export type LoginError = {
  errorCode: "PASSWORD_RESET_REQUIRED";
  token: string;
};

export type UserSessionSecrets = {
  privateKey: JsonWebKey;
  encryptionKey: JsonWebKey;
  sanityCheck: string;
};

export type Result<T = any, E = any> =
  | (T & { status: "ok" })
  | (E & { status: "error"; errorCode: string; message: string });

export type ReplaceType<T, R, W> = T extends R ? W : (
  T extends object ? {
      [K in keyof T]: ReplaceType<T[K], R, W>;
    }
    : (
      T extends any[] ? ReplaceType<T[number], R, W>[] : T
    )
);

// Replaces all EntityId with string recursively
export type ReplaceEntityId<T> = T extends EntityId ? string : (
  T extends object ? {
      [K in keyof T]: ReplaceEntityId<T[K]>;
    }
    : (
      T extends any[] ? ReplaceEntityId<T[number]>[] : T
    )
);

export * from "./messageTypes.ts";
