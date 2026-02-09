import type { Meta, StoryObj } from "@storybook/react";

import { Loader } from "./Loader.tsx";

const meta: Meta<typeof Loader> = {
  component: Loader,
  title: "Atoms/Loader",
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Default: Story = {
  render: () => (
    <div style={{ height: 40, position: "relative" }}>
      <Loader />
    </div>
  ),
};
