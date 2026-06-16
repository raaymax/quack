// deno-lint-ignore-file no-explicit-any

const DB_NAME = "quack";
const STORE = "keys";
const RECORD_ID = "session";

export type SessionKeys = {
  privateKey: CryptoKey;
};

function hasIndexedDB(): boolean {
  return !!(globalThis as any).indexedDB;
}

function openDb(): Promise<any> {
  return new Promise((resolve, reject) => {
    const idb = (globalThis as any).indexedDB;
    if (!idb) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = idb.open(DB_NAME, 1);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = (e: any) => resolve(e.target.result);
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export async function saveSessionKeys(keys: SessionKeys): Promise<void> {
  if (!hasIndexedDB()) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(keys, RECORD_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = (e: any) => reject(e.target.error);
    });
  } finally {
    db.close();
  }
}

export async function loadSessionKeys(): Promise<SessionKeys | null> {
  let db: any;
  try {
    db = await openDb();
  } catch {
    return null;
  }
  try {
    const result = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(RECORD_ID);
      req.onsuccess = (e: any) => resolve(e.target.result ?? null);
      req.onerror = (e: any) => reject(e.target.error);
    });
    if (result && result.privateKey instanceof CryptoKey) {
      return result as SessionKeys;
    }
    return null;
  } finally {
    db.close();
  }
}

export async function clearSessionKeys(): Promise<void> {
  let db: any;
  try {
    db = await openDb();
  } catch {
    return;
  }
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(RECORD_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = (e: any) => reject(e.target.error);
    });
  } finally {
    db.close();
  }
}
