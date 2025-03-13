import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Emoji } from "../../js/components/molecules/Emoji";

const meta: Meta<typeof Emoji> = {
  component: Emoji,
};

export default meta;
type Story = StoryObj<typeof Emoji>;

export const Primary: Story = {
  args: {
    shortname: ":smile:",
    size: 50,
  },
};
