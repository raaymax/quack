import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "./Input.tsx";
import { app } from "../../core/index.ts";

// Helper to get input model at render time (after loaders run)
const getInputModel = () => {
  const channel = app.channels.get("input-test");
  if (!channel) return undefined;
  return channel.getThread(null, { init: true }).input;
};

const meta: Meta<typeof Input> = {
  component: Input,
  title: "Organisms/Input",
  loaders: [async () => {
    app.channels.upsert({
      id: "input-test",
      name: "test-channel",
      channelType: "PUBLIC",
      users: [],
    });
  }],
  argTypes: {
    model: {
      control: false,
      description: "Input model from thread context",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => {
    const model = getInputModel();
    if (!model) return <div>Loading...</div>;
    return <Input model={model} />;
  },
};
