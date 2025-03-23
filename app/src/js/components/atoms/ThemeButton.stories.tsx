import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ThemeButton } from "./ThemeButton.tsx";

const meta: Meta<typeof ThemeButton> = {
  component: ThemeButton,
};

export default meta;
type Story = StoryObj<typeof ThemeButton>;

export const Primary: Story = {
  args: {
    themes: {
      theme1: { name: "Theme 1", icon: "smile" },
      theme2: { name: "Theme 2", icon: "bars" },
      theme3: { name: "Theme 3", icon: "icons" },
    },
    active: "theme1",
  },
};
