import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { LoginPage } from "../../js/components/pages/LoginPage";

const meta: Meta<typeof LoginPage> = {
  component: LoginPage,
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

export const Primary: Story = {
  args: {
    error: "Error message",
  },
};
