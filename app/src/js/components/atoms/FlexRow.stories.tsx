import type { Meta, StoryObj } from "@storybook/react";

import { FlexRow } from "./FlexRow.tsx";

const meta: Meta<typeof FlexRow> = {
  component: FlexRow,
  title: "Atoms/FlexRow",
  argTypes: {
    $gap: {
      control: "text",
      description: "Gap between items",
    },
    $align: {
      control: "select",
      options: ["center", "flex-start", "flex-end", "stretch", "baseline"],
      description: "Align items along the cross axis",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FlexRow>;

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

export const WithGap: Story = {
  args: {
    $gap: "16px",
    children: (
      <>
        <div style={{ padding: "8px", background: "#e0e0e0" }}>Item 1</div>
        <div style={{ padding: "8px", background: "#e0e0e0" }}>Item 2</div>
        <div style={{ padding: "8px", background: "#e0e0e0" }}>Item 3</div>
      </>
    ),
  },
};

export const WithAlignment: Story = {
  args: {
    $align: "flex-start",
    children: (
      <>
        <div style={{ padding: "8px", background: "#e0e0e0" }}>Short</div>
        <div style={{ padding: "16px 8px", background: "#d0d0d0" }}>Taller</div>
        <div style={{ padding: "24px 8px", background: "#c0c0c0" }}>
          Tallest
        </div>
      </>
    ),
  },
};
