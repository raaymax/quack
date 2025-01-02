import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { ActionButton } from '../../js/components/atoms/ActionButton';
import { MessageProvider } from '../../js/components/contexts/message.tsx';


const meta: Meta<typeof ActionButton> = {
  component: ActionButton,
  render: ({children, action, payload, style}) => (
    <MessageProvider value={{
      id: '123',
      secured: false,
      channelId: 'main',
      userId: '123',
      createdAt: '2021-01-01T00:00:00Z',
      clientId: '123',
      flat: 'Hello, world!',
      message: {text: 'Hello, world!'},
      links: [],
      emojiOnly: false,
      reactions: [],
      attachments: [],
      linkPreviews: [],
      parentId: '',
      appId: '123',
      pinned: false,
      editing: false,
      updatedAt: '2021-01-01T00:00:00Z',
    }}>
      <ActionButton action={action} payload={payload} style={style}>
        {children}
      </ActionButton>
    </MessageProvider>
  )
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
