import { createContext } from 'react';
import type { MessageModel } from '../../core/models/message';

export const MessageContext = createContext<{model?: MessageModel}>({});

export const MessageProvider = ({ children, value }: {children: React.ReactNode, value: MessageModel}) => (
  <MessageContext.Provider value={{ model: value }}>
    {children}
  </MessageContext.Provider>
);
