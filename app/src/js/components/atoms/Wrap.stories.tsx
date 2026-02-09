import type { Meta, StoryObj } from "@storybook/react";

import { Wrap } from "./Wrap.tsx";

const meta: Meta<typeof Wrap> = {
  component: Wrap,
  title: "Atoms/Wrap",
  argTypes: {
    children: {
      control: false,
      description: "Content to wrap",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Wrap>;

export const Default: Story = {
  args: {
    children: (
      <>
        <div style={{ padding: "8px", background: "#e0e0e0" }}>Item 1</div>
        <div style={{ padding: "8px", background: "#e0e0e0" }}>Item 2</div>
        <div style={{ padding: "8px", background: "#e0e0e0" }}>Item 3</div>
      </>
    ),
  },
};

export const ManyItems: Story = {
  args: {
    children: (
      <>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ padding: "8px", background: "#e0e0e0" }}>
            Item {i + 1}
          </div>
        ))}
      </>
    ),
  },
};

export const VariedSizes: Story = {
  args: {
    children: (
      <>
        <div style={{ padding: "8px 16px", background: "#e0e0e0" }}>Short</div>
        <div style={{ padding: "8px 32px", background: "#d0d0d0" }}>
          Medium length
        </div>
        <div style={{ padding: "8px 48px", background: "#c0c0c0" }}>
          Much longer content
        </div>
        <div style={{ padding: "8px", background: "#b0b0b0" }}>Tiny</div>
      </>
    ),
  },
};
