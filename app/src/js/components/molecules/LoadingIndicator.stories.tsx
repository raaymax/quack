import type { Meta, StoryObj } from "@storybook/react";

import { LoadingIndicator } from "./LoadingIndicator.tsx";

const meta: Meta<typeof LoadingIndicator> = {
  component: LoadingIndicator,
};

export default meta;
type Story = StoryObj<typeof LoadingIndicator>;

export const Primary: Story = {
  args: {},
};
