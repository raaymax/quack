/* global JsonWebKey */
const iterations = 100_000;
const hash = "SHA-256";
const keyLength = 256;

export function toBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function fromBase64(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function importKey(key: JsonWebKey | CryptoKey): Promise<CryptoKey> {
  if (key instanceof CryptoKey) {
    return Promise.resolve(key);
  }
  return crypto.subtle.importKey("jwk", key, { name: "AES-CBC" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export function encryptor(jwk: JsonWebKey) {
  const key = crypto.subtle.importKey("jwk", jwk, { name: "AES-CBC" }, false, [
    "encrypt",
    "decrypt",
  ]);

  return {
    encrypt: async (message: any) => {
      const iv = crypto.getRandomValues(new Uint8Array(16));
      const encoded = new TextEncoder().encode(JSON.stringify(message));
      const keyy = await key;
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        keyy,
        encoded,
      );
      return {
        encrypted: toBase64(encrypted),
        _iv: toBase64(iv),
      };
    },
    decrypt: async (data: { encrypted: string; _iv: string }) => {
      if (!data.encrypted || !data._iv) return data;
      const ciphertext = fromBase64(data.encrypted);
      const iv = fromBase64(data._iv);
      const plaintext = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv },
        await key,
        ciphertext,
      );
      const decoder = new TextDecoder();
      const text = decoder.decode(plaintext);
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    },
  };
}
export async function encrypt(
  message: any,
  encryptionKey: JsonWebKey | CryptoKey,
) {
  const key = importKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encoded = new TextEncoder().encode(JSON.stringify(message));
  const keyy = await key;
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    keyy,
    encoded,
  );
  return {
    encrypted: toBase64(encrypted),
    _iv: toBase64(iv),
  };
}

export async function decrypt<T = any>(
  data: { encrypted: string; _iv: string },
  encryptionKey: JsonWebKey | CryptoKey,
): Promise<T> {
  const key = importKey(encryptionKey);
  if (!data.encrypted || !data._iv) {
    throw new Error("Invalid data - cannot decrypt");
  }
  const ciphertext = fromBase64(data.encrypted);
  const iv = fromBase64(data._iv);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    await key,
    ciphertext,
  );
  const decoder = new TextDecoder();
  const text = decoder.decode(plaintext);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Cannot parse JSON from decrypted data");
  }
}
export async function deriveEncryptionKeyFromPassword(
  password: string,
  salt: string,
): Promise<JsonWebKey> {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(salt),
      iterations: iterations,
      hash: hash,
    },
    passwordKey,
    {
      name: "AES-CBC",
      length: keyLength,
    },
    true,
    ["encrypt", "decrypt"],
  );

  return await crypto.subtle.exportKey("jwk", derivedKey);
}

export function generateSalt() {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export function generateRandomToken() {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(16)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}

export async function deriveSaltFromEmail(email: string) {
  const encoder = new TextEncoder();
  const loginBytes = encoder.encode(email);
  const hashBuffer = await crypto.subtle.digest("SHA-256", loginBytes);
  return toBase64(hashBuffer);
}

export async function hashPassword(password: string, salt: string) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromBase64(salt),
      iterations: iterations,
      hash: hash,
    },
    passwordKey,
    keyLength,
  );

  const keyBase64 = toBase64(derivedBits);
  return keyBase64;
}

export async function generatePasswordKeys(
  password: string,
  salt: string,
): Promise<{ hash: string; encryptionKey: JsonWebKey }> {
  return {
    hash: await hashPassword(password, salt),
    encryptionKey: await deriveEncryptionKeyFromPassword(
      password,
      salt,
    ),
  };
}

export async function prepareCredentials(email: string, password: string) {
  const salt = await deriveSaltFromEmail(email);
  const { hash, encryptionKey } = await generatePasswordKeys(password, salt);
  const keys = splitJSON(encryptionKey);
  return { login: { email, password: hash, key: keys[0] }, key: keys[1] };
}

export async function generateKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-CBC", // Algorithm
      length: 256, // Key length (256 bits)
    },
    true, // Extractable (true if you need to export it later)
    ["encrypt", "decrypt"], // Usages
  );
  return await crypto.subtle.exportKey("jwk", key);
}

export const split = (secret: string): [string, string] => {
  const buff = new TextEncoder().encode(secret);
  const rand1 = crypto.getRandomValues(new Uint8Array(buff.length));
  const rand2 = new Uint8Array(rand1);
  for (const i in buff) {
    rand2[i] = rand2[i] ^ buff[i];
  }
  return [toBase64(rand1), toBase64(rand2)];
};

export const join = ([a, b]: [string, string]): string => {
  if (a.length !== b.length) {
    return "INVALID";
  }
  const aBuff = fromBase64(a);
  const bBuff = fromBase64(b);
  const output = new Uint8Array(aBuff.length);
  for (const i in output) {
    output[i] = aBuff[i] ^ bBuff[i];
  }
  return new TextDecoder().decode(output);
};

export const splitJSON = (secret: object): [string, string] => {
  const input = JSON.stringify(secret);
  return split(input);
};

export const joinJSON = <T>([a, b]: [string, string]): T => {
  const joined = join([a, b]);
  const out: T = JSON.parse(joined);
  return out;
};

export async function generateECKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"],
  );

  return {
    publicKey: await crypto.subtle.exportKey("jwk", keyPair.publicKey),
    privateKey: await crypto.subtle.exportKey("jwk", keyPair.privateKey),
  };
}

export async function prepareRegistration(
  { name, email, password }: { name?: string; email: string; password: string },
) {
  const salt = await deriveSaltFromEmail(email);
  const { hash, encryptionKey } = await generatePasswordKeys(
    password,
    salt,
  );
  const { publicKey, privateKey } = await generateECKeyPair();
  const userEncryptionKey = await generateKey();
  const secrets = await encrypt({
    privateKey,
    userEncryptionKey,
    sanityCheck: "valid",
  }, encryptionKey);

  return {
    name,
    email,
    password: hash,
    publicKey,
    secrets,
  };
}
