import { useContext } from 'react';
import { MessageContext } from './message';
import { ViewMessage } from '../../types';

export const useMessageData = (): ViewMessage => {
  const context = useContext(MessageContext);
  if (context.model === undefined) throw new Error('useMessageData must be used within a MessageContext');
  return context.model;
};
