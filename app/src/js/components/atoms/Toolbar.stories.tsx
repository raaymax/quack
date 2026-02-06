import type { Meta, StoryObj } from "@storybook/react";

import { Toolbar } from "./Toolbar.tsx";
import { Icon } from "./Icon.tsx";
import { BaseButton } from "./BaseButton.tsx";

const meta: Meta<typeof Toolbar> = {
  component: Toolbar,
  title: "Atoms/Toolbar",
  argTypes: {
    size: {
      control: { type: "number", min: 24, max: 48, step: 4 },
      description: "Size of toolbar items in pixels",
    },
    children: {
      control: false,
      description: "Toolbar content",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
  args: {
    size: 32,
    children: (
      <>
        <BaseButton><Icon icon="edit" /></BaseButton>
        <BaseButton><Icon icon="delete" /></BaseButton>
        <BaseButton><Icon icon="reply" /></BaseButton>
      </>
    ),
  },
};

export const WithTitle: Story = {
  args: {
    size: 32,
    children: (
      <>
        <h3>Toolbar Title</h3>
        <div className="separator" />
        <BaseButton><Icon icon="xmark" /></BaseButton>
      </>
    ),
  },
};
