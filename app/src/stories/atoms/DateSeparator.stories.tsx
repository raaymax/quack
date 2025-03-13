import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { DateSeparator } from "../../js/components/atoms/DateSeparator";

const meta: Meta<typeof DateSeparator> = {
  component: DateSeparator,
};

export default meta;
type Story = StoryObj<typeof DateSeparator>;

export const Primary: Story = {
  args: {},
};
