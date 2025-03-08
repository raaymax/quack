import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { ThreadInfo } from "../../js/components/molecules/ThreadInfo";

const meta: Meta<typeof ThreadInfo> = {
  component: ThreadInfo,
};

export default meta;
type Story = StoryObj<typeof ThreadInfo>;

export const Primary: Story = {
  args: {
    msg: {
      thread: [
        {
          childId: "123",
          userId: "321",
        },
        {
          childId: "222",
          userId: "222",
        },
      ],
      updatedAt: "2021-09-01T12:00:00Z",
      channelId: "123",
    },
  },
};
