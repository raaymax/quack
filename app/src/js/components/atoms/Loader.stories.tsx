import type { Meta, StoryObj } from "@storybook/react";

import { Loader } from "./Loader.tsx";

const meta: Meta<typeof Loader> = {
  component: Loader,
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Primary: Story = {
  args: {},
};
