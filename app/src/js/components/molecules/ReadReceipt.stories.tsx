import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ReadReceiptModel } from "../../core/models/readReceipt.ts";
import { app } from "../../core/index.ts";
import { ReadReceipt } from "./ReadReceipt.tsx";

const meta: Meta<typeof ReadReceipt> = {
  component: ReadReceipt,
};

export default meta;
type Story = StoryObj<typeof ReadReceipt>;

export const Primary: Story = {
  args: {
    model: [
      new ReadReceiptModel({
        id: "1",
        channelId: "1",
        parentId: null,
        userId: "1",
        count: 1,
        lastRead: new Date(),
        lastMessageId: "1",
      }, app),
      new ReadReceiptModel({
        id: "2",
        channelId: "1",
        parentId: null,
        userId: "2",
        count: 1,
        lastRead: new Date(),
        lastMessageId: "1",
      }, app),
      new ReadReceiptModel({
        id: "3",
        channelId: "1",
        parentId: null,
        userId: "3",
        count: 1,
        lastRead: new Date(),
        lastMessageId: "1",
      }, app),
    ],
  },
};
