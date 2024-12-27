export type EncryptedData = {
  encrypted: string,
  _iv: string,
}

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

export type PublicUser = {
  id: string;
  alias: string | null;
  email: string;
  name: string;
  avatarFileId: string;
  status?: "active" | "inactive" | "away";
  publicKey: JsonWebKey;
};

export type User = {
  id: string;
  authType: "argon2" | "bcrypt";
  salt: string;
  alias: string | null;
  email: string;
  password: string;
  name: string;
  avatarFileId: string;
  mainChannelId: string;
  status?: "active" | "inactive" | "away";
  publicKey: JsonWebKey;

  secrets: {
    password: EncryptedData,
    backup: EncryptedData,
  }
};

export type UserSession = {
  status: "ok" | "error";
  token: string;
  userId: string;
  publicKey: JsonWebKey;
  secrets: EncryptedData;
  key: string;
}

export type UserSessionSecrets = {
  privateKey: JsonWebKey,
  encryptionKey: JsonWebKey,
  sanityCheck: string,
}

export type Result<T = any, E = any> = (T & { status: "ok"}) | (E & { status: "error", message: string });
