import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Files } from "../../js/components/molecules/Files";

const meta: Meta<typeof Files> = {
  component: Files,
};

export default meta;
type Story = StoryObj<typeof Files>;

export const Primary: Story = {
  args: {},
};
