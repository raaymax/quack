import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Badge } from "../../js/components/atoms/Badge";

const meta: Meta<typeof Badge> = {
  component: Badge,
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Primary: Story = {
  args: {
    children: "123",
  },
};
