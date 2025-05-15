import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ThreadLink } from "./ThreadLink.tsx";

const meta: Meta<typeof ThreadLink> = {
  component: ThreadLink,
};

export default meta;
type Story = StoryObj<typeof ThreadLink>;

export const Primary: Story = {
  args: {},
};
