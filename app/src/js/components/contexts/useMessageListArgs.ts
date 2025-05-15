import { useContext } from "react";
import { MessageListArgsContext } from "./messageListArgs.tsx";

export const useMessageListArgs = (): string => {
  const state = useContext(MessageListArgsContext);
  if (typeof state === "undefined") {
    throw new Error(
      "useMessageListArgs must be used within a MessageListArgsContext",
    );
  }

  return state;
};
