import type { Meta, StoryObj } from "@storybook/react";

import { Workspaces } from "./Workspaces.tsx";

const meta: Meta<typeof Workspaces> = {
  component: Workspaces,
  title: "Organisms/Workspaces",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", display: "flex" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Workspaces>;

export const Default: Story = {
  args: {},
};
