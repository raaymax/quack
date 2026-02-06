import type { Meta, StoryObj } from "@storybook/react";

import { SearchBox } from "./SearchBox.tsx";

const meta: Meta<typeof SearchBox> = {
  component: SearchBox,
  title: "Atoms/SearchBox",
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    defaultValue: {
      control: "text",
      description: "Initial value",
    },
    onSearch: {
      action: "searched",
      description: "Called when Enter is pressed",
    },
    onChange: {
      action: "changed",
      description: "Called on input change",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBox>;

export const Default: Story = {
  args: {
    placeholder: "Search here...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Hello",
    placeholder: "Search...",
  },
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: "Search messages...",
  },
};
