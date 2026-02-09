import type { Meta, StoryObj } from "@storybook/react";

import { ChannelCreateForm } from "./ChannelCreateForm.tsx";

const meta: Meta<typeof ChannelCreateForm> = {
  component: ChannelCreateForm,
  title: "Molecules/ChannelCreateForm",
  parameters: {
    layout: "fullscreen",
  },
  args: {
    isOpen: true,
  },
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the modal is open",
    },
    onSubmit: {
      action: "submitted",
      description: "Called when the form is submitted with channel data",
    },
    onCancel: {
      action: "cancelled",
      description: "Called when the modal is closed or cancelled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChannelCreateForm>;

export const Default: Story = {
  args: {},
};

export const Closed: Story = {
  args: {
    isOpen: false,
  },
};
