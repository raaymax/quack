import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { TextWithIcon } from "../../js/components/molecules/TextWithIcon";

const meta: Meta<typeof TextWithIcon> = {
  component: TextWithIcon,
};

export default meta;
type Story = StoryObj<typeof TextWithIcon>;

export const Primary: Story = {
  args: {
    icon: "star",
    children: "Hello, World!",
  },
};
