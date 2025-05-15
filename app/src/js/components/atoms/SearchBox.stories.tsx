import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { SearchBox } from "./SearchBox.tsx";

const meta: Meta<typeof SearchBox> = {
  component: SearchBox,
};

export default meta;
type Story = StoryObj<typeof SearchBox>;

export const Primary: Story = {
  args: {},
};
