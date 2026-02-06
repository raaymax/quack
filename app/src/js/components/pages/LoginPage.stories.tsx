import type { Meta, StoryObj } from "@storybook/react";

import { LoginPage } from "./LoginPage.tsx";

const meta: Meta<typeof LoginPage> = {
  component: LoginPage,
  title: "Pages/LoginPage",
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    error: {
      control: "text",
      description: "Error message to display",
    },
    disabled: {
      control: "boolean",
      description: "Whether the form is disabled (loading state)",
    },
    onSubmit: {
      action: "submitted",
      description: "Called when the form is submitted",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

export const Default: Story = {
  args: {},
};

export const WithError: Story = {
  args: {
    error: "Invalid email or password",
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
  },
};

export const LongError: Story = {
  args: {
    error: "Your account has been locked due to too many failed login attempts. Please try again in 30 minutes.",
  },
};
