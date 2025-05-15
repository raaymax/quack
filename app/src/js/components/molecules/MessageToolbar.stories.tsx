import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { MessageToolbar } from "./MessageToolbar.tsx";

const meta: Meta<typeof MessageToolbar> = {
  component: MessageToolbar,
};

export default meta;
type Story = StoryObj<typeof MessageToolbar>;

export const Primary: Story = {
  args: {},
};
