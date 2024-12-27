import {client} from '../core';
import * as enc from '@quack/encryption';

type Session = {
  status: 'ok' | 'error';
  token: string;
  userId: string;
  publicKey: string;
  encryptedPrivateKey: string;
  sanityCheck: string;
  key: string;
}

type RegisterRequest = {
  name: string;
  email: string;
  passwordHash: string;
  publicKey: string;
  encryptedPrivateKey: string;
  sanityCheck: string;
}

export async function login(email: string, password: string) {
  const {hash, encryptionKey} = await enc.generatePasswordKeys(password);
  client.api.setEncryptionKey(encryptionKey);
  const keyPair = enc.split(encryptionKey);
  localStorage.setItem('key', keyPair[1]);
  const session = await client.api.login({email, password: hash, key: keyPair[0]});
  await validateSession(session);
  return session;
}

export async function restoreSession() {
  const key = localStorage.getItem('key');
  if (!key) return;
  const ret = await this.fetch('/api/auth/session');
  const session = await ret.json();
  await validateSession(session);
  return session;
}

export async function validateSession(session: Session) {
  const key = localStorage.getItem('key');
  if (session.status === 'ok') {
    localStorage.setItem('userId', session.userId);
    this.token = session.token;
    localStorage.setItem('token', session.token);
    const encryptionKey = enc.join([key, session.key]);
    client.api.setEncryptionKey(encryptionKey);
    if(enc.decrypt(session.sanityCheck, encryptionKey) !== 'valid') {
      return false;
    }
    return true;
  }
  return false;
}
    
export async function logout() {
  localStorage.removeItem('key');
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  return await client.api.auth.logout();
}

export async function register(name: string, email: string, password: string) {
  const {hash, encryptionKey} = await enc.generatePasswordKeys(password);
  const sanityCheck = enc.encrypt("valid", encryptionKey);
  const {publicKey, privateKey} =  enc.generateECKeyPair();
  const encryptedPrivateKey = enc.encrypt(privateKey, encryptionKey);
  return await client.api.register({name, email, passwordHash: hash, sanityCheck, publicKey, encryptedPrivateKey});
}
