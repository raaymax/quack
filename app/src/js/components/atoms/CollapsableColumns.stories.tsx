import type { Meta, StoryObj } from "@storybook/react";

import { CollapsableColumns } from "./CollapsableColumns.tsx";

const meta: Meta<typeof CollapsableColumns> = {
  component: CollapsableColumns,
  title: "Atoms/CollapsableColumns",
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    minSize: {
      control: { type: "number", min: 100, max: 400, step: 50 },
      description: "Minimum size before collapsing",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CollapsableColumns>;

export const TwoColumns: Story = {
  args: {
    minSize: 200,
    columns: [
      <div key={1} style={{ flex: 1, background: "#333", padding: 16 }}>Column 1</div>,
      <div key={2} style={{ flex: 1, background: "#444", padding: 16 }}>Column 2</div>,
    ],
  },
};

export const SingleColumn: Story = {
  args: {
    minSize: 200,
    columns: [
      <div key={1} style={{ flex: 1, background: "#333", padding: 16 }}>Single Column</div>,
    ],
  },
};
