import * as enc from "./mod.ts";
import { assert, assertEquals, assertNotEquals } from "@std/assert";

Deno.test("Test encryption process", async () => {
  const jwk = await enc.generateKey();
  const data = { test: "test" };
  const encrypted = await enc.encrypt(data, jwk);
  const decrypted = await enc.decrypt(encrypted, jwk);
  assertEquals(data, decrypted);
});

Deno.test("Password hash should be always the same", async () => {
  const password = "password";
  const salt = await enc.generateSalt();
  const hash1 = await enc.hashPassword(password, salt);
  const hash2 = await enc.hashPassword(password, salt);
  assertEquals(hash1, hash2);
});

Deno.test("Password hash should be different for different passwords", async () => {
  const password1 = "password1";
  const password2 = "password2";
  const salt = await enc.generateSalt();
  const hash1 = await enc.hashPassword(password1, salt);
  const hash2 = await enc.hashPassword(password2, salt);
  assertNotEquals(hash1, hash2);
});

Deno.test("Test encryption process with password", async () => {
  const password = "password";
  const salt = await enc.generateSalt();
  const key = await enc.deriveEncryptionKeyFromPassword(password, salt);
  const data = { test: "test" };
  const encrypted = await enc.encrypt(data, key);
  const key2 = await enc.deriveEncryptionKeyFromPassword(password, salt);
  const decrypted = await enc.decrypt(encrypted, key2);
  assertEquals(data, decrypted);
});

Deno.test("Test encryption process with password and email", async () => {
  const password = "password";
  const email = "test@example.com";
  const salt = await enc.deriveSaltFromEmail(email);
  const key = await enc.deriveEncryptionKeyFromPassword(password, salt);
  const data = { test: "test" };
  const encrypted = await enc.encrypt(data, key);
  const key2 = await enc.deriveEncryptionKeyFromPassword(password, salt);
  const decrypted = await enc.decrypt(encrypted, key2);
  assertEquals(data, decrypted);
});

Deno.test("Splitting and combining keys", async () => {
  const password = "password";
  const salt = enc.generateSalt();
  const key = await enc.deriveEncryptionKeyFromPassword(password, salt);
  const [a, b] = enc.splitJSON(key);
  const key2 = enc.joinJSON([a, b]);
  assertEquals(key2, key);
});
