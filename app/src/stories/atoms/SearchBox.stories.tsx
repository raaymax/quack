import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { SearchBox } from "../../js/components/atoms/SearchBox";

const meta: Meta<typeof SearchBox> = {
  component: SearchBox,
};

export default meta;
type Story = StoryObj<typeof SearchBox>;

export const Primary: Story = {
  args: {},
};
