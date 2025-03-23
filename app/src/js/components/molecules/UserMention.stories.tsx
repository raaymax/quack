import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { UserMention } from "../../js/components/molecules/UserMention";

const meta: Meta<typeof UserMention> = {
  component: UserMention,
};

export default meta;
type Story = StoryObj<typeof UserMention>;

export const Primary: Story = {
  args: {
    userId: "you",
  },
};
