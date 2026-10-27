import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import {
  type ChannelNavItem,
  type ChannelViewKey,
  NavChannelTree,
} from "./NavChannelTree.tsx";

const channels: ChannelNavItem[] = [
  { id: "c-general", name: "general", kind: "PUBLIC", unread: 3 },
  { id: "c-design", name: "design-team", kind: "PRIVATE" },
  { id: "c-random", name: "random", kind: "PUBLIC" },
  { id: "c-ada", name: "Ada Lovelace", kind: "DIRECT", unread: 1 },
];

const meta: Meta<typeof NavChannelTree> = {
  component: NavChannelTree,
  title: "Molecules/NavChannelTree",
  parameters: { layout: "padded" },
  decorators: [
    (Story) => <div style={{ width: 280 }}><Story /></div>,
  ],
};

export default meta;
type Story = StoryObj<typeof NavChannelTree>;

export const Interactive: Story = {
  render: () => {
    const [activeChannelId, setActiveChannelId] = useState("c-general");
    const [activeView, setActiveView] = useState<ChannelViewKey>("files");

    return (
      <NavChannelTree
        channels={channels}
        activeChannelId={activeChannelId}
        activeView={activeView}
        onSelectChannel={(id) => {
          setActiveChannelId(id);
          setActiveView("messages");
        }}
        onSelectView={(id, view) => {
          setActiveChannelId(id);
          setActiveView(view);
        }}
      />
    );
  },
};

export const FilesActive: Story = {
  args: {
    channels,
    activeChannelId: "c-general",
    activeView: "files",
  },
};

export const Mobile: Story = {
  render: () => {
    const [activeChannelId, setActiveChannelId] = useState("c-general");
    const [activeView, setActiveView] = useState<ChannelViewKey>("files");
    return (
      <NavChannelTree
        channels={channels}
        activeChannelId={activeChannelId}
        activeView={activeView}
        onSelectChannel={(id) => {
          setActiveChannelId(id);
          setActiveView("messages");
        }}
        onSelectView={(id, view) => {
          setActiveChannelId(id);
          setActiveView(view);
        }}
      />
    );
  },
  parameters: { viewport: { defaultViewport: "mobile" } },
  decorators: [(Story) => <div style={{ width: "100%" }}><Story /></div>],
};
