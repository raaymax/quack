import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { Attachments } from "./Attachments.tsx";

const meta: Meta<typeof Attachments> = {
  component: Attachments,
};

export default meta;
type Story = StoryObj<typeof Attachments>;

export const Primary: Story = {
  args: {},
};
