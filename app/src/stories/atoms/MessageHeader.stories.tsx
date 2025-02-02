/* global JsonWebKey */
import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { MessageHeader } from '../../js/components/atoms/MessageHeader';
import { UserModel } from '../../js/core/models/user.ts';

const meta: Meta<typeof MessageHeader> = {
  component: MessageHeader,
};
 
export default meta;
type Story = StoryObj<typeof MessageHeader>;
 
export const Primary: Story = {
  args: {
    user: new UserModel({
      id: '123',
      name: 'Test User',
      email: 'john@example.com',
      avatarFileId: '123',
      publicKey: {} as JsonWebKey,
    }),
    createdAt: '2021-08-10T10:00:00Z',
  },
};
