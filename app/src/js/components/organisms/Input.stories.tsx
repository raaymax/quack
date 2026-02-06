import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "./Input.tsx";
import { app } from "../../core/index.ts";

const meta: Meta<typeof Input> = {
  component: Input,
  title: "Organisms/Input",
  argTypes: {
    model: {
      control: false,
      description: "Input model from thread context",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Primary: Story = {
  args: {
    model: app.channels.get("123")?.getThread("null", { init: false }).input,
  },
  render: (args) => <Input {...args} />,
};
