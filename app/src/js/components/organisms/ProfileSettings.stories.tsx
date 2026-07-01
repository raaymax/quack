import type { Meta, StoryObj } from "@storybook/react";

import { ProfileSettings } from "./ProfileSettings.tsx";
import { app, client } from "../../core/index.ts";
import { UserModel } from "../../core/models/user.ts";
import type { User } from "../../types.ts";

const seedProfile = (overrides: Partial<User> = {}) => {
  app.profile = new UserModel({
    id: "story-user",
    alias: null,
    email: "ada@example.com",
    name: "Ada Lovelace",
    avatarFileId: "",
    publicKey: {} as JsonWebKey,
    ...overrides,
  }, app);

  client.api.updateProfile = async (data: { name: string }) => {
    app.profile?.patch({ ...app.profile, ...data } as User);
    return { ...(app.profile as unknown as User), ...data };
  };
  client.api.uploadAvatar = async (file: File) => {
    const avatarFileId = URL.createObjectURL(file);
    app.profile?.patch({ ...app.profile, avatarFileId } as User);
    return { ...(app.profile as unknown as User), avatarFileId };
  };
};

const meta: Meta<typeof ProfileSettings> = {
  component: ProfileSettings,
  title: "Organisms/ProfileSettings",
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onClose: {
      action: "closed",
      description: "Called when the modal is closed, cancelled, or saved",
    },
  },
  loaders: [async () => seedProfile()],
  render: (args) => <ProfileSettings {...args} />,
};

export default meta;
type Story = StoryObj<typeof ProfileSettings>;

export const Default: Story = {
  args: {},
};

export const LongName: Story = {
  args: {},
  loaders: [async () =>
    seedProfile({
      name: "Augusta Ada King, Countess of Lovelace",
      email: "augusta.ada.king@analytical-engine.example.com",
    })],
};
