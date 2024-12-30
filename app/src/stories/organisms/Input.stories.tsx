import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { Input } from '../../js/components/organisms/Input';

 
const meta: Meta<typeof Input> = {
  component: Input,
};
 
export default meta;
type Story = StoryObj<typeof Input>;
 
export const Primary: Story = {
  args: {
    mode: 'default',
    channelId: '123',
  },
  render: (args) => <Input {...args} />,
};
