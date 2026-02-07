import type { Meta, StoryObj } from "@storybook/react";

import { ActionButton } from "./ActionButton.tsx";
import { MessageProvider } from "../contexts/message.tsx";
import { MessageModel } from "../../core/models/message.ts";
import { app } from "../../core/index.ts";

const meta: Meta<typeof ActionButton> = {
  component: ActionButton,
  title: "Molecules/ActionButton",
  argTypes: {
    children: {
      control: "text",
      description: "Button content",
    },
    action: {
      control: "text",
      description: "Action identifier sent to API",
    },
    payload: {
      control: "object",
      description: "Additional payload data",
    },
  },
  loaders: [async () => {
    app.channels.upsert({
      id: "test",
      name: "test",
      channelType: "PUBLIC",
      users: [],
    });
  }],
  render: ({ children, action, payload, style }) => {
    const message = MessageModel.from({
      userId: "me",
      flat: "Hello, world!",
      message: { text: "Hello, world!" },
    }, app.getMessages("test"));
    return (
      <MessageProvider value={message}>
        <ActionButton action={action} payload={payload} style={style}>
          {children}
        </ActionButton>
      </MessageProvider>
    );
  },
};

export default meta;
type Story = StoryObj<typeof ActionButton>;

export const Primary: Story = {
  args: {
    children: "Button",
    action: "resend",
    payload: { test: "test" },
  },
};
