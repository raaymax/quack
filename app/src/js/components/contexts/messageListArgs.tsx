import { createContext } from "react";
import { MessageListArgs } from "../../types.ts";

export const MessageListArgsContext = createContext<string>("main");

type MessageListArgsParams = {
  children: React.ReactNode;
  value?: Partial<MessageListArgs>;
  streamId: string;
};

export const MessageListArgsProvider = (
  { streamId, children }: MessageListArgsParams,
) => {
  return (
    <MessageListArgsContext.Provider value={streamId}>
      {children}
    </MessageListArgsContext.Provider>
  );
};
