/* global JsonWebKey */
import * as enc from '@quack/encryption';
import { BaseMessage, FullMessage, Message, MessageData } from "../client";
import { EncryptedData, EncryptedMessage } from '../../types';

type Messages = Message | Message[];


export class MessageEncryption {
  static decrypt = async (msg: Messages, encryptionKey?: JsonWebKey | null): Promise<FullMessage[]> => {
    try{ 
      if(!encryptionKey){
        return [msg].flat().filter((m) => {
          if (m.secured) console.warn('no encryption key - skipping decryption');
          return !m.secured;
        }) as FullMessage[];
      }
      const e = enc.encryptor(encryptionKey);

      return Promise.all([msg].flat().map(async (msg) => {
        if (!msg.secured) return msg;

        const {encrypted, _iv, ...rest} = msg;
        const base: BaseMessage = rest;
        const decrypted: MessageData = await e.decrypt({encrypted, _iv});
        const ret: FullMessage = {...base, ...decrypted, secured: false};
        return ret;
      }));
    }catch(e){
      console.error(e);
      throw e;
    }
  }

  static encrypt = async (msg: FullMessage, encryptionKey: JsonWebKey ): Promise<Partial<Message>> => {
    const {clientId, channelId, parentId, ...data} = msg;
    if(!encryptionKey){
      return {
        clientId,
        channelId,
        parentId,
        ...data,
        secured: false,
      };
    }
    const e = enc.encryptor(encryptionKey);
    const encrypted: EncryptedData = await e.encrypt(data);
    const m: Partial<EncryptedMessage> = {
      clientId,
      channelId,
      parentId,
      ...encrypted,
      secured: true,
    };
    return m;
  }
}
