import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { EmojiSearch } from '../../js/components/organisms/EmojiSearch';
import { store, methods } from '../../js/store';

 
const meta: Meta<typeof EmojiSearch> = {
  component: EmojiSearch,
  parameters: {
  },
  loaders: [async () => {
    store.dispatch(methods.emojis.load({}));
  }],
};
 
export default meta;
type Story = StoryObj<typeof EmojiSearch>;
 
export const Primary: Story = {
  args: {

  },
  render: (args) => <EmojiSearch {...args} />,
};
