import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { Reactions } from "./Reactions.tsx";
import { MessageModel } from "../../core/models/message.ts";
import { app } from "../../core/index.ts";

// Create message model at render time (after loaders run)
const createMessageModel = () => {
  return MessageModel.from({
    flat: "hello",
    message: { text: "hello" },
    reactions: [
      { userId: "me", reaction: "👍" },
      { userId: "you", reaction: "👎" },
    ],
  }, app.getMessages("test"));
};

const meta: Meta<typeof Reactions> = {
  component: Reactions,
};

export default meta;
type Story = StoryObj<typeof Reactions>;

export const Primary: Story = {
  render: () => <Reactions messageModel={createMessageModel()} />,
};

export const WithAddButton: Story = {
  render: () => (
    <Reactions
      messageModel={createMessageModel()}
      onClick={() => {}}
    />
  ),
};
