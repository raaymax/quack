import type { Meta, StoryObj } from "@storybook/react";

import { SearchBoxInput } from "./SearchBoxInput.tsx";

const meta: Meta<typeof SearchBoxInput> = {
  component: SearchBoxInput,
  title: "Atoms/SearchBoxInput",
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    value: {
      control: "text",
      description: "Current input value",
    },
    onChange: {
      action: "changed",
      description: "Called on input change",
    },
    onKeyDown: {
      action: "keyDown",
      description: "Called on key down",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBoxInput>;

export const Default: Story = {
  args: {
    value: "",
    placeholder: "Search here...",
  },
};

export const WithValue: Story = {
  args: {
    value: "Hello",
    placeholder: "Search...",
  },
};

export const CustomPlaceholder: Story = {
  args: {
    value: "",
    placeholder: "Search messages...",
  },
};
