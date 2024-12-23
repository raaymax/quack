/* global JsonWebKey */
const iterations = 100_000;
const hash = "SHA-256";
const keyLength = 256;

function toBase64( buffer: ArrayBuffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa( binary );
}

function fromBase64( base64: string ) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export function encryptor(jwk: JsonWebKey) {
  const key = crypto.subtle.importKey("jwk", jwk, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]);
  
  return {
    encrypt: async (message: any) => {
      const iv = crypto.getRandomValues(new Uint8Array(16));
      const encoded = new TextEncoder().encode(JSON.stringify(message));
      const keyy = await key;
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv }, keyy, encoded
      );
      return { 
        encrypted: toBase64(encrypted),
        _iv: toBase64(iv)
      };
    },
    decrypt: async (data: {encrypted: string, _iv: string}) => {
      if (!data.encrypted || !data._iv) return data;
      const ciphertext = fromBase64(data.encrypted);
      const iv = fromBase64(data._iv);
      const plaintext = await crypto.subtle.decrypt(
          { name: "AES-CBC", iv },
          await key,
          ciphertext
      );
      const decoder = new TextDecoder();
      const text = decoder.decode(plaintext);
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
  };
}
export async function deriveEncryptionKeyFromPassword(password: string, salt: string) {
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
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
        false, // This one is not extractable
        ["encrypt", "decrypt"]
    );

    return derivedKey;
}

export async function hashPassword(password: string, salt: string) {
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: fromBase64(salt),
            iterations: iterations,
            hash: hash,
        },
        passwordKey,
        keyLength
    );

    const keyBase64 = toBase64(derivedBits);
    return keyBase64;
}

export async function generatePasswordKeys(password: string, salt: string) {
  return {
    hash: await hashPassword(password, salt),
    passwordEncryptionKey: await deriveEncryptionKeyFromPassword(password, salt),
  };
}
