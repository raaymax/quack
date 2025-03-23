import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ErrorPage } from "./ErrorPage.tsx";

const meta: Meta<typeof ErrorPage> = {
  component: ErrorPage,
};

export default meta;
type Story = StoryObj<typeof ErrorPage>;

export const Primary: Story = {
  args: {
    debug: {
      error: "Error message",
      stack: "Stack trace",
    },
  },
};
