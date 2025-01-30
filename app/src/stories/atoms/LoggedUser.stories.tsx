import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { LoggedUser } from '../../js/components/atoms/LoggedUser.tsx';
import { UserProvider } from '../../js/components/contexts/user.tsx';
import { User, app } from '../../js/core';


const meta: Meta<typeof LoggedUser> = {
  component: LoggedUser,
  decorators: [
    (Story) => (
      <UserProvider value="1">
        <Story />
      </UserProvider>
    ),
  ],
  loaders: [async () => {
    app.users.add({ id: '1', name: 'John Doe' } as User);
  }],
};
 
export default meta;
type Story = StoryObj<typeof LoggedUser>;
 
export const Primary: Story = {
  args: {
  },
};
