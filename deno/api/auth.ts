import type {
  LoginError,
  Result,
  UserSession,
  UserSessionSecrets,
} from "./types.ts";
import * as enc from "@quack/encryption";
import type API from "./mod.ts";
import {
  clearSessionKeys,
  loadSessionKeys,
  saveSessionKeys,
  type SessionKeys,
} from "./cryptoStore.ts";

export class ApiError extends Error {
  payload: Record<string, unknown>;
  url: string;
  status: number;
  constructor(
    msg: string,
    status: number,
    url: string,
    payload: Record<string, unknown>,
  ) {
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
  ): Promise<Result<UserSession, LoginError>> {
    const credentials = await enc.prepareCredentials(email, password);
    const ret = await this.api.fetchWithCredentials("/api/auth/session", {
      method: "POST",
      body: JSON.stringify(credentials.login),
    });
    if (ret.status !== 200) {
      const error = await ret.json();
      return { status: "error", ...error };
    }
    const session: UserSession = await ret.json();
    await this.activateSession(session, credentials.encryptionKey);
    return session;
  }

  async restoreSession(): Promise<Result<UserSession>> {
    const keys = await loadSessionKeys();
    if (!keys) return { status: "error" };
    const ret = await this.api.fetchWithCredentials("/api/auth/session");
    const session = await ret.json();
    if (session.status !== "ok") {
      await this.clear();
      return session;
    }
    this.applyKeys(session, keys);
    return session;
  }

  async activateSession(
    session: UserSession,
    encryptionKey: JsonWebKey,
  ): Promise<boolean> {
    try {
      if (session.status !== "ok") return false;
      const secrets: UserSessionSecrets = await enc.decrypt(
        session.secrets,
        encryptionKey,
      );
      if (secrets.sanityCheck !== "valid") return false;
      const keys: SessionKeys = {
        privateKey: await enc.importPrivateKey(secrets.privateKey),
      };
      this.applyKeys(session, keys);
      try {
        await saveSessionKeys(keys);
      } catch (e) {
        console.warn("Could not persist session keys", e);
      }
      return true;
    } catch (e) {
      console.error("Error activating session", e);
      return false;
    }
  }

  applyKeys(session: UserSession, keys: SessionKeys) {
    localStorage.setItem("userId", session.userId);
    this.api.token = session.token;
    localStorage.setItem("token", session.token);
    this.api.privateKey = keys.privateKey;
    this.api.publicKey = session.publicKey;
  }

  async clear() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    await clearSessionKeys();
  }

  async logout() {
    await this.clear();
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
    value: {
      token: string;
      email: string;
      password: string;
      oldPassword: string;
    },
  ): Promise<Result> {
    const data = await enc.prepareRegistration(value);
    const ret = await this.api.fetchWithCredentials(
      `/api/auth/reset/${value.token}`,
      {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          oldPassword: value.oldPassword,
        }),
      },
    );
    if (ret.status !== 200) {
      return { status: "error", ...await ret.json() };
    }
    return { status: "ok", ...await ret.json() };
  }
}

export default AuthAPI;
