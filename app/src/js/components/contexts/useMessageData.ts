import { useContext } from "react";
import { MessageContext } from "./message.tsx";
import { MessageModel } from "../../core/models/message.ts";

export const useMessageData = (): MessageModel => {
  const context = useContext(MessageContext);
  if (context.model === undefined) {
    throw new Error("useMessageData must be used within a MessageContext");
  }
  return context.model;
};
