import { createContext } from 'react';
import { ViewMessage } from '../../types';

export const MessageContext = createContext<{data?: ViewMessage}>({});

export const MessageProvider = ({ children, value }: {children: React.ReactNode, value: ViewMessage}) => (
  <MessageContext.Provider value={{ data: value }}>
    {children}
  </MessageContext.Provider>
);
