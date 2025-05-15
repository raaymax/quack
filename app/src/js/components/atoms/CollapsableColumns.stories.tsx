import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { CollapsableColumns } from "./CollapsableColumns.tsx";

const meta: Meta<typeof CollapsableColumns> = {
  component: CollapsableColumns,
};

export default meta;
type Story = StoryObj<typeof CollapsableColumns>;

export const Primary: Story = {
  args: {
    minSize: 200,
    columns: [<div key={1}>Column 1</div>, <div key={2}>Column 2</div>],
  },
};
