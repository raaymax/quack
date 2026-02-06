import type { Meta, StoryObj } from "@storybook/react";

import { RegistrationPage } from "./RegistrationPage.tsx";

const meta: Meta<typeof RegistrationPage> = {
  component: RegistrationPage,
  title: "Pages/RegistrationPage",
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
type Story = StoryObj<typeof RegistrationPage>;

export const Default: Story = {
  args: {},
};

export const WithError: Story = {
  args: {
    error: "Email address is already registered",
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
  },
};

export const ValidationError: Story = {
  args: {
    error: "Password must be at least 8 characters long",
  },
};
