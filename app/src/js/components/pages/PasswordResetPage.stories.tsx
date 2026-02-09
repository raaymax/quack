import type { Meta, StoryObj } from "@storybook/react";

import { PasswordResetPage } from "./PasswordResetPage.tsx";

const meta: Meta<typeof PasswordResetPage> = {
  component: PasswordResetPage,
  title: "Pages/PasswordResetPage",
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
type Story = StoryObj<typeof PasswordResetPage>;

export const Default: Story = {
  args: {},
};

export const WithError: Story = {
  args: {
    error: "Old password is incorrect",
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
  },
};

export const PasswordMismatch: Story = {
  args: {
    error: "New password does not meet security requirements. Must be at least 8 characters.",
  },
};
