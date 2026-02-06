import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Resizer } from "./Resizer.tsx";

const meta: Meta<typeof Resizer> = {
  component: Resizer,
  title: "Atoms/Resizer",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Resizer>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(250);
    return (
      <div style={{ display: "flex", height: 200 }}>
        <div style={{ width: value, background: "#333", padding: 16 }}>
          Sidebar ({value}px)
        </div>
        <Resizer value={value} onChange={setValue} />
        <div style={{ flex: 1, background: "#222", padding: 16 }}>
          Main content
        </div>
      </div>
    );
  },
};
