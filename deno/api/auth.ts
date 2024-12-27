import type { Result, UserSession, UserSessionSecrets } from "./types.ts";
import * as enc from "@quack/encryption";
import type API from "./mod.ts";

export class ApiError extends Error {
  payload: any;
  url: string;
  status: number;
  constructor(msg: string, status: number, url: string, payload: any) {
    super(msg);
    this.status = status;
    this.url = url;
    this.payload = payload;
  }
}

class AuthAPI extends EventTarget {
  api: API;

  constructor(api: API) {
    super();
    this.api = api;
  }
  async checkRegistrationToken(
    value: { token: string },
  ): Promise<{ valid: boolean }> {
    const ret = await this.api.fetchWithCredentials(
      `/api/users/token/${value.token}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return await ret.json();
  }

  me(): string | null {
    return this.api.userId ?? null;
  }

  async login(
    { email, password }: { email: string; password: string },
  ): Promise<Result<UserSession>> {
    const credentials = await enc.prepareCredentials(email, password);
    localStorage.setItem("key", credentials.key);
    const ret = await this.api.fetchWithCredentials("/api/auth/session", {
      method: "POST",
      body: JSON.stringify(credentials.login),
    });
    if (ret.status !== 200) {
      const error = await ret.json();
      console.log(error);
      return { status: "error", ...error };
    }
    const session: UserSession = await ret.json();
    await this.validateSession(session);
    return session;
  }

  async restoreSession(): Promise<UserSession | null> {
    const key = localStorage.getItem("key");
    if (!key) return { status: "error" };
    const ret = await this.api.fetchWithCredentials("/api/auth/session");
    const session = await ret.json();
    console.log(session);
    await this.validateSession(session);
    return session;
  }

  async validateSession(session: UserSession): Promise<boolean> {
    const key = localStorage.getItem("key");
    if (!key) return false;
    if (session.status === "ok") {
      localStorage.setItem("userId", session.userId);
      this.api.token = session.token;
      localStorage.setItem("token", session.token);
      const encryptionKey = enc.joinJSON<JsonWebKey>([key, session.key]);
      const secrets: UserSessionSecrets = await enc.decrypt(
        session.secrets,
        encryptionKey,
      );
      if (secrets.sanityCheck !== "valid") return false;
      this.api.userEncryptionKey = secrets.encryptionKey;
      this.api.privateKey = secrets.privateKey;
      this.api.publicKey = session.publicKey;
      return true;
    }
    return false;
  }

  async logout() {
    localStorage.removeItem("key");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    const ret = await this.api.fetchWithCredentials("/api/auth/session", {
      method: "DELETE",
      body: "{}",
    });
    await ret.body?.cancel();
  }

  async register(
    value: { name: string; email: string; password: string; token: string },
  ) {
    const data = await enc.prepareRegistration(value);
    const ret = await this.api.fetchWithCredentials(
      `/api/users/${value.token}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    if (ret.status !== 200) {
      throw await ret.json();
    }
    return await ret.json();
  }
  async checkPasswordResetToken(
    value: { token: string },
  ): Promise<{ valid: boolean; email: string }> {
    const ret = await this.api.fetchWithCredentials(
      `/api/auth/reset/${value.token}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return await ret.json();
  }

  async resetPassword(
    value: { token: string; email: string; password: string },
  ) {
    const data = await enc.prepareRegistration(value);
    const ret = await this.api.fetchWithCredentials(
      `/api/auth/reset/${value.token}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
    if (ret.status !== 200) {
      throw await ret.json();
    }
    return await ret.json();
  }
}

type EncryptedData = {
  encrypted: string;
  _iv: string;
};

type ChangePasswordRequest = {
  email: string;
  oldPasswordHash: string;
  passwordHash: string;
  publicKey: JsonWebKey;
  encryptedPrivateKey: EncryptedData;
  userEncryptionKey: EncryptedData;
  sanityCheck: EncryptedData;
};

type RegisterRequest = {
  name: string;
  email: string;
  passwordHash: string;
  publicKey: JsonWebKey;
  encryptedPrivateKey: string;
  sanityCheck: string;
};

export default AuthAPI;
