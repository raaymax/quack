import type { Meta, StoryObj } from "@storybook/react";

import { PageLoader } from "./PageLoader.tsx";

const meta: Meta<typeof PageLoader> = {
  component: PageLoader,
  title: "Atoms/PageLoader",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof PageLoader>;

export const Default: Story = {};
