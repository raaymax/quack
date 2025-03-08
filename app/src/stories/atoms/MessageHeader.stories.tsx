/* global JsonWebKey */
import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { MessageHeader } from "../../js/components/atoms/MessageHeader";
import { app } from "../../js/core";

const meta: Meta<typeof MessageHeader> = {
  component: MessageHeader,
  loaders: [async () => {
    app.users.upsert({
      id: "123",
      name: "Test User",
      email: "john@example.com",
      avatarFileId: "123",
      publicKey: {} as JsonWebKey,
    });
  }],
};

export default meta;
type Story = StoryObj<typeof MessageHeader>;

export const Primary: Story = {
  args: {
    user: app.users.get("123"),
    createdAt: "2021-08-10T10:00:00Z",
  },
};
