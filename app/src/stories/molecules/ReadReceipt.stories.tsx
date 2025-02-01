import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { ReadReceiptModel } from 'app/src/js/core/models/readReceipt.ts';
import { app } from '../../js/core';
import { ReadReceipt } from 'app/src/js/components/molecules/ReadReceipt.tsx';

const meta: Meta<typeof ReadReceipt> = {
  component: ReadReceipt,
};
 
export default meta;
type Story = StoryObj<typeof ReadReceipt>;
 
export const Primary: Story = {
  args: {
    model: [
      new ReadReceiptModel({
        id: '1',
        channelId: '1',
        parentId: null,
        userId: '1',
        count: 1,
        lastRead: new Date(),
        lastMessageId: '1',
      }, app),
      new ReadReceiptModel({
        id: '2',
        channelId: '1',
        parentId: null,
        userId: '2',
        count: 1,
        lastRead: new Date(),
        lastMessageId: '1',
      }, app),
      new ReadReceiptModel({
        id: '3',
        channelId: '1',
        parentId: null,
        userId: '3',
        count: 1,
        lastRead: new Date(),
        lastMessageId: '1',
      }, app),
    ],
  },
};
