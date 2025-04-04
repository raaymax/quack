import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { RegistrationPage } from "./RegistrationPage.tsx";

const meta: Meta<typeof RegistrationPage> = {
  component: RegistrationPage,
};

export default meta;
type Story = StoryObj<typeof RegistrationPage>;

export const Primary: Story = {
  args: {
    error: "Error message",
  },
};
