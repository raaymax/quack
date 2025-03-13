import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Tag } from "../../js/components/atoms/Tag";

const meta: Meta<typeof Tag> = {
  component: Tag,
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Primary: Story = {
  args: {
    children: "😅 123",
  },
};
