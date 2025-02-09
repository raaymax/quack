import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { ActionButton } from '../../js/components/atoms/ActionButton';
import { MessageProvider } from '../../js/components/contexts/message.tsx';
import { MessageModel } from '../../js/core/models/message.ts';
import { app } from '../../js/core';


const meta: Meta<typeof ActionButton> = {
  component: ActionButton,
  loaders: [async () => {
    app.channels.upsert({
      id: 'test',
      name: 'test',
      channelType: 'PUBLIC',
      users: [],
    });
  }],
  render: ({children, action, payload, style}) => {
    const message = MessageModel.from({
      userId: 'me',
      flat: 'Hello, world!',
      message: {text: 'Hello, world!'},
    }, app.getMessages('test'));
    return <MessageProvider value={message}>
      <ActionButton action={action} payload={payload} style={style}>
        {children}
      </ActionButton>
    </MessageProvider>
  }
};
 
export default meta;
type Story = StoryObj<typeof ActionButton>;
 
export const Primary: Story = {
  args: {
    children: 'Button',
    action: 'resend',
    payload: {test: 'test'},
  },
};
