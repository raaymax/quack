import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { NavChannels } from '../../js/components/molecules/NavChannels';

const meta: Meta<typeof NavChannels> = {
  component: NavChannels,
};
 
export default meta;
type Story = StoryObj<typeof NavChannels>;
 
export const Primary: Story = {
  args: {
  },
};
