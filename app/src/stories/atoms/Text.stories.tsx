import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Text } from "../../js/components/atoms/Text";

const meta: Meta<typeof Text> = {
  component: Text,
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Primary: Story = {
  args: {
    children: "Hello, World!",
    size: 50,
  },
};
