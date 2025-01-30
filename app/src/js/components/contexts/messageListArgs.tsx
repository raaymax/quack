import { createContext, useState } from 'react';
import { MessageListArgs } from '../../types';

type SetMessageListArgs = (stream: MessageListArgs) => void;

export const MessageListArgsContext = createContext<[MessageListArgs, SetMessageListArgs]>([{type: 'live', id: 'main'}, () => ({})]);

type MessageListArgsParams = {
  children: React.ReactNode;
  value?: Partial<MessageListArgs>;
  streamId: string;
};

export const MessageListArgsProvider = ({ streamId, children, value = {}}: MessageListArgsParams) => {
  const [state, setState] = useState<MessageListArgs>({type: 'live', ...value, id: streamId});
  return (
    <MessageListArgsContext.Provider value={[state, (a: Partial<MessageListArgs>) => {
      setState({type: 'live', selected: state.selected, ...a, id: streamId})
    }]}>
      {children}
    </MessageListArgsContext.Provider>
  );
}
