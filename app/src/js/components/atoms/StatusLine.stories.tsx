import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { StatusLine } from "./StatusLine.tsx";
import { AppModel } from "../../core/models/app.ts";

const meta: Meta<typeof StatusLine> = {
  component: StatusLine,
  loaders: [async () => {
  }],
};

const app = new AppModel();
app.channels.upsert({
  id: "123",
  channelType: "PUBLIC",
  name: "test",
  users: ["123"],
});

export default meta;
type Story = StoryObj<typeof StatusLine>;

export const Primary: Story = {
  args: {
    typing: app.getThread("123", null, { init: false }).typing,
    info: app.info,
  },
};
