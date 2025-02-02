import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { Input } from '../../js/components/organisms/Input';
import { app } from '../../js/core';

 
const meta: Meta<typeof Input> = {
  component: Input,
};
 
export default meta;
type Story = StoryObj<typeof Input>;
 
export const Primary: Story = {
  args: {
    model: app.channels.get('123')?.getThread('null', {init: false}).input,
  },
  render: (args) => <Input {...args} />,
};
