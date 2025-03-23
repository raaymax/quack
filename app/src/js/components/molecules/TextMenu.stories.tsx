import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { TextMenu } from "./TextMenu.tsx";

const meta: Meta<typeof TextMenu> = {
  component: TextMenu,
};

export default meta;
type Story = StoryObj<typeof TextMenu>;

export const Primary: Story = {
  args: {},
};
