import { encode, decode } from 'js-base64';

function bytesToBase64(bytes) {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  return btoa(binString);
}

function arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa( binary );
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
        encrypted: arrayBufferToBase64(encrypted),
        _iv: bytesToBase64(iv)
      };
    },
    decrypt: async (data: {encrypted: string, _iv: string}) => {
      if (!data.encrypted || !data._iv) return data;
      const ciphertext = Uint8Array.from(atob(data.encrypted), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(data._iv), c => c.charCodeAt(0))
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
