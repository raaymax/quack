import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { FilesToolbar, type ViewMode } from "./FilesToolbar.tsx";

const meta: Meta<typeof FilesToolbar> = {
  component: FilesToolbar,
  title: "Molecules/FilesToolbar",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof FilesToolbar>;

export const Interactive: Story = {
  render: () => {
    const [query, setQuery] = useState("");
    const [view, setView] = useState<ViewMode>("list");
    const [showDates, setShowDates] = useState(true);

    return (
      <FilesToolbar
        channelName="general"
        count={42}
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
        showDates={showDates}
        onToggleDates={() => setShowDates((v) => !v)}
      />
    );
  },
};

export const PrivateChannel: Story = {
  render: () => (
    <FilesToolbar
      channelName="design-team"
      channelType="PRIVATE"
      count={8}
      query=""
      onQueryChange={() => {}}
      view="grid"
      onViewChange={() => {}}
      showDates={false}
      onToggleDates={() => {}}
    />
  ),
};
