import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { NavChannel } from '../../js/components/molecules/NavChannel';
import { store, actions } from '../../js/store';

const meta: Meta<typeof NavChannel> = {
  component: NavChannel,
  loaders: [async () => {
    store.dispatch(actions.channels.add({ id: 'channelId', name: 'SuperChannel', users: [], channelType: 'PUBLIC' }));
  }],
};
 
export default meta;
type Story = StoryObj<typeof NavChannel>;
 
export const Primary: Story = {
  args: {
    channelId: 'channelId',
  },
};