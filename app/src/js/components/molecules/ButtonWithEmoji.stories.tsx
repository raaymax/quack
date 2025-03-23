import type { Meta, StoryObj } from "@storybook/react";

import "../../../styles.ts";
import { ButtonWithEmoji } from "./ButtonWithEmoji.tsx";
import { AppModel } from "../../core/models/app.ts";
import { AppProvider } from "../contexts/appState.tsx";

const app = new AppModel();
app.emojis.upsert({
  empty: false,
  unicode: "😀",
  shortname: ":smile:",
  category: "people",
});

const meta: Meta<typeof ButtonWithEmoji> = {
  component: ButtonWithEmoji,
  decorators: [
    (Story) => (
      <AppProvider value={app}>
        <Story />
      </AppProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ButtonWithEmoji>;

export const Primary: Story = {
  args: {
    emoji: ":smile:",
    children: "Hello, World!",
  },
};
