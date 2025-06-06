import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { LoggedUser } from "./LoggedUser.tsx";
import { UserProvider } from "../contexts/user.tsx";
import { app, User } from "../../core/index.ts";

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
    app.users.upsert({ id: "1", name: "John Doe" } as User);
  }],
};

export default meta;
type Story = StoryObj<typeof LoggedUser>;

export const Primary: Story = {
  args: {},
};
