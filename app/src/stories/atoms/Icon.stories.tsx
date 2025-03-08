import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Icon } from "../../js/components/atoms/Icon";

const meta: Meta<typeof Icon> = {
  component: Icon,
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Star: Story = {
  args: {
    icon: "star",
  },
};

export const Bars: Story = {
  args: {
    icon: "bars",
  },
};

export const Emojis: Story = {
  args: {
    icon: "emojis",
  },
};

export const Hash: Story = {
  args: {
    icon: "hash",
  },
};
