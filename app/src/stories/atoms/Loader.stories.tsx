import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Loader } from "../../js/components/atoms/Loader";

const meta: Meta<typeof Loader> = {
  component: Loader,
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Primary: Story = {
  args: {},
};
