import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { DiscussionHeader } from '../../js/components/molecules/DiscussionHeader';
import { store, actions} from '../../js/store';

const meta: Meta<typeof DiscussionHeader> = {
  component: DiscussionHeader,
  loaders: [async () => {
    store.dispatch(actions.users.add({
      id: '123',
      name: 'John Doe',
    }));
    store.dispatch(actions.users.add({
      id: '321',
      name: 'Katie Doe',
    }));
    store.dispatch(actions.me.set('123'));

    store.dispatch(actions.channels.add({
      id: 'public',
      channelType: 'PUBLIC',
      users: ['123'],
      name: 'Channel Name',
    }));
    store.dispatch(actions.channels.add({
      id: 'private',
      channelType: 'PRIVATE',
      users: ['123'],
      name: 'Private Channel Name',
    }));
    store.dispatch(actions.channels.add({
      id: 'direct',
      channelType: 'DIRECT',
      users: ['123', '321'],
      name: 'Direct Channel Name',
    }));
    store.dispatch(actions.channels.add({
      id: 'personal',
      channelType: 'DIRECT',
      users: ['123'],
      name: 'Personal Channel Name',
    }));
  }],
};
 
export default meta;
type Story = StoryObj<typeof DiscussionHeader>;
 
export const PublicChannel: Story = {
  args: {
    channelId: 'public',
  },
};

export const PrivateChannel: Story = {
  args: {
    channelId: 'private',
  },
};

export const DirectChannel: Story = {
  args: {
    channelId: 'direct',
  },
};

export const PersonalChannel: Story = {
  args: {
    channelId: 'personal',
  },
};
