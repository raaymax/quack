import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { File } from "../../js/components/atoms/File";

const meta: Meta<typeof File> = {
  component: File,
};

export default meta;
type Story = StoryObj<typeof File>;

export const Primary: Story = {
  args: {
    data: {
      fileName: "file.txt",
      contentType: "text/plain",
    },
  },
};
