import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { Reactions } from '../../js/components/molecules/Reactions';
import { MessageModel } from 'app/src/js/core/models/message.ts';
import { app } from '../../js/core';

const meta: Meta<typeof Reactions> = {
  component: Reactions,
};
 
export default meta;
type Story = StoryObj<typeof Reactions>;
 
export const Primary: Story = {
  args: {
    messageModel: MessageModel.from({
      flat: 'hello',
      message: { text: 'hello' },
      reactions: [
        {userId: 'me', reaction: '👍'},
        {userId: 'you', reaction: '👎'},
      ],
    }, app),
  },
};
export const WithAddButton: Story = {
  args: {
    messageModel: MessageModel.from({
      flat: 'hello',
      message: { text: 'hello' },
      reactions: [
        {userId: 'me', reaction: '👍'},
        {userId: 'you', reaction: '👎'},
      ],
    }, app),
    onClick: () => {},
  },
};
