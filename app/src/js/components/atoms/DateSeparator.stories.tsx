import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { DateSeparator } from "./DateSeparator.tsx";

const meta: Meta<typeof DateSeparator> = {
  component: DateSeparator,
};

export default meta;
type Story = StoryObj<typeof DateSeparator>;

export const Primary: Story = {
  args: {},
};
