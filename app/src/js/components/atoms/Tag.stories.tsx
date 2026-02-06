import type { Meta, StoryObj } from "@storybook/react";

import { Tag } from "./Tag.tsx";

const meta: Meta<typeof Tag> = {
  component: Tag,
  title: "Atoms/Tag",
  argTypes: {
    children: {
      control: "text",
      description: "Tag content",
    },
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {
    children: "Tag",
  },
};

export const WithEmoji: Story = {
  args: {
    children: "😅 123",
  },
};

export const Multiple: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <Tag onClick={() => {}}>React</Tag>
      <Tag onClick={() => {}}>TypeScript</Tag>
      <Tag onClick={() => {}}>Storybook</Tag>
    </div>
  ),
};
